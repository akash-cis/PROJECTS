from datetime import datetime, date, time, timedelta
from django.conf import settings
# from user.models import Profile
from payment.models import Invoice
from settings.models import SuperAdminSettings
from .utils import cent_to_dollar, dollar_to_cent
import stripe
stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_PRIVATE_KEY


'''
Manages the creation of a Stripe user account
'''
class StripeAccount:

	def __init__(self, user):

		self.user = user

	def create(self):
		#create Stripe account
		
		agent_account = stripe.Customer.create(
			email = self.user.email,
			address={
				"city":self.user.profile.city,
				"country":self.user.profile.country,
				"line1":self.user.profile.address,
				"postal_code": self.user.profile.postal_code,
				"state":self.user.profile.state,
				},
			name=self.user.get_full_name(),
			phone= self.user.contact
			)
		up = self.user.profile
		up.agent_id = agent_account["id"]
		up.save()

	def update(self):
		agent_account = stripe.Customer.modify(
			self.user.profile.agent_id,
			address={
				"city":self.user.profile.city,
				"country":self.user.profile.country,
				"line1":self.user.profile.address,
				"postal_code": self.user.profile.postal_code,
				"state":self.user.profile.state,
				},
			email=self.user.email,
			name=self.user.get_full_name(),
			phone= self.user.contact
			)
		return agent_account

	def delete(self):
		try:
			agent_account = stripe.Customer.update(self.user.profile.agent_id)
			return agent_account['deleted']
		except stripe.error.StripeError as e:
			message = "Something went wrong While deleting the customer."
			return message
		except Exception as e:
			return e





'''
Manage payments
'''
class StripePayment:

	def __init__(self, *args, **kwargs):

		self.user = kwargs.get("user")
		self.agent_id = kwargs.get("agent_id")
		self.token = kwargs.get("token")
		self.save_card = kwargs.get("save_card")
		# self.amount = kwargs.get("amount")
		self.card_id = kwargs.get("card_id")
		self.description = kwargs.get("description")
		self.currency = kwargs.get("currency")
		self.set_default = kwargs.get("set_default")

	def create(self):

		try:
			#Create a source (new card)
			if self.token:
				card = stripe.Customer.create_source(
				  self.agent_id,
				  source=self.token
				)
			#Retreive a source (saved card)
			else:
				card = stripe.Customer.retrieve_source(
					self.agent_id,
					self.card_id
					)
			
			#Modify Stipes customer account with a default card
			if self.set_default or self.token:
				stripe.Customer.modify(
					self.agent_id, 
					default_source=card.id,
					)

			#Create an invoice items for the transaction
			# invoice_item = stripe.InvoiceItem.create(
			#   customer= self.agent_id,
			#   amount= self.amount,
			#   currency=self.currency,
			#   description= self.description
			# )

			#Create invoice
			new_invoice = stripe.Invoice.create(
			  customer=self.agent_id,
			  # default_tax_rates=[tax_id],
			  collection_method="charge_automatically",
			)

			#Finalise the invoice for payment
			invoice = stripe.Invoice.finalize_invoice(new_invoice.id)
			print('-----------invoice: ',invoice['id'])

			#Pay the invoice 
			charge = stripe.Invoice.pay(
				invoice.id,
				source=card.id,
				)

			message = "Perfect"
			return {"message": message, "tran_id": charge["id"], "invoice": charge}

		except stripe.error.CardError as e:
			message = "Card Error"
			return {"message": message, "tran_id": None}

		except stripe.error.RateLimitError as e:
			message = "Rate limit error"
			return {"message": message, "tran_id": None}
		
		except stripe.error.InvalidRequestError as e:
			message = "Invalid parameter"
			return {"message": e, "tran_id": None}
		
		except stripe.error.AuthenticationError as e:
			message = "Not authenticated"
			return {"message": message, "tran_id": None}

		except stripe.error.APIConnectionError as e:
			message = "Network error"
			return {"message": message, "tran_id": None}
		
		except stripe.error.StripeError as e:
			message = "Something went wrong, you were not charged"
			return {"message": message, "tran_id": None}
		
		except Exception as e:
			message = "Serious error, we have been notified"
			return {"message": message, "tran_id": None}


	def send_invoice(self):
		try:
			setting = SuperAdminSettings.objects.first()
			invoice = stripe.Invoice.create(
				customer=self.agent_id,
				collection_method='send_invoice',
				days_until_due=setting.due_days,
			)

			invoice_sent = invoice.send_invoice()

			message = "Perfect"
			return {"message": message, "invoice": invoice, "invoice_sent": invoice_sent}

		except SuperAdminSettings.DoesNotExist as e:
			message = "Due date settings must be set."
			return {"message": e, "invoice": invoice['id']}

		except stripe.error.InvalidRequestError as e:
			message = "Invalid parameter"
			return {"message": message, "invoice": invoice['id']}
		
		except stripe.error.AuthenticationError as e:
			message = "Not authenticated"
			return {"message": message, "invoice": invoice['id']}

		except stripe.error.APIConnectionError as e:
			message = "Network error"
			return {"message": message, "invoice": invoice['id']}
		
		except stripe.error.StripeError as e:
			message = "Something went wrong, you were not charged"
			return {"message": message, "invoice": invoice['id']}
		
		except Exception as e:
			message = "Serious error, we have been notified"
			return {"message": message, "invoice": invoice['id']}


	def pay_invoice(self):

		try:

			#Create invoice
			new_invoice = stripe.Invoice.create(
			  customer=self.agent_id,
			  collection_method="charge_automatically",
			)

			print('--------------new invoice id: ',new_invoice['id'])
			
			if self.card_id:
				card = stripe.Customer.retrieve_source(
					self.agent_id,
					self.card_id,
				)
			else:
				cus = stripe.Customer.retrieve(self.agent_id)
				card = stripe.Customer.retrieve_source(
					self.agent_id,
					cus['default_source'],
				)


			# Finalise the invoice for payment
			invoice = stripe.Invoice.finalize_invoice(new_invoice['id'])
			print('-----------invoice: ',invoice['id'])

			#Pay the invoice  
			charge = stripe.Invoice.pay(
				invoice['id'],
				source=card['id'],
			)

			message = "Perfect"
			return {"message": message, "tran_id": charge["id"], "invoice": charge}

		except stripe.error.InvalidRequestError as e:
			message = "Invalid parameter"
			print(e, message)
			return {"message": e, "tran_id": None}
		
		except stripe.error.AuthenticationError as e:
			message = "Not authenticated"
			print(e, message)
			return {"message": message, "tran_id": None}

		except stripe.error.APIConnectionError as e:
			message = "Network error"
			print(e, message)
			return {"message": message, "tran_id": None}
		
		except stripe.error.StripeError as e:
			message = "Something went wrong, you were not charged"
			print(e, message)
			return {"message": message, "tran_id": None}
		
		except Exception as e:
			message = "Serious error, we have been notified"
			print(e, message)
			return {"message": message, "tran_id": None}


	def pay_unpaid_invoices(self):
		try:

			if self.card_id:
				card = stripe.Customer.retrieve_source(
					self.agent_id,
					self.card_id,
				)
			else:
				if self.token:
					card = stripe.Customer.create_source(
						self.agent_id,
						source=self.token
					)
				# cus = stripe.Customer.retrieve(self.agent_id)
				# if cus['default_source']:
				# 	card = stripe.Customer.retrieve_source(
				# 		self.agent_id,
				# 		cus['default_source'],
				# 	)
				# else:


			#Create invoice
			invoices = StripeData(self.user).invoices(['draft','open'])

			#Pay the invoice  
			for invoice in invoices:
				charge = stripe.Invoice.pay(
					invoice['id'],
					source=card['id'],
				)
				print(charge['status'])
				if charge['status']:
					invoice = Invoice(
						user=self.user,
						company=self.user.company,
						tran_id=charge['id'],
						amount=float(cent_to_dollar(charge['total'])),
						status = charge['status'],
						paid = charge['paid'],
						invoice_pdf = charge['invoice_pdf'],
						hosted_invoice_url = charge['hosted_invoice_url'],
					)
					invoice.save()

			if not self.save_card and self.token:
				stripe.Customer.delete_source(
					self.agent_id,
					card['id'],
				)

			message = "Perfect"
			return {"message": message, "tran_id": charge["id"], "invoice": charge}

		except stripe.error.InvalidRequestError as e:
			message = "Invalid parameter"
			print(e, message)
			return {"message": e, "tran_id": None}
		
		except stripe.error.AuthenticationError as e:
			message = "Not authenticated"
			print(e, message)
			return {"message": message, "tran_id": None}

		except stripe.error.APIConnectionError as e:
			message = "Network error"
			print(e, message)
			return {"message": message, "tran_id": None}
		
		except stripe.error.StripeError as e:
			message = "Something went wrong, you were not charged"
			print(e, message)
			return {"message": message, "tran_id": None}
		
		except Exception as e:
			message = "Serious error, we have been notified"
			print(e, message)
			return {"message": message, "tran_id": None}





'''
Produces and returns a list of cards assigned to each user
'''
class StripeData:

	def __init__(self, user):
		self.user = user

	def cards(self):

		agent_id = self.user.profile.agent_id			
		
		try:
			#Query saved user cards
			cards = stripe.Customer.list_sources(
				  agent_id,
				  limit=3,
				  object='card'
				)

			#Create a list of cards
			card_list = [
			[index+1, c["id"], c["brand"],f'**** {c["last4"]}',f'{c["exp_month"]}/{c["exp_year"]}'] 
			for index, c in enumerate(cards["data"])
			]

			if not card_list:
				return None
			return card_list
		except Exception:
			return  None
		

	def invoices(self, status=None):

		agent_id = self.user.profile.agent_id

		try:
			unpaid_invoices = []
			#Query user invoices
			if not status:
				invoices = stripe.Invoice.list(
					customer = agent_id
					)
			else:
				for s in status:
					invoices = stripe.Invoice.list(
						customer = agent_id,
						status=s
						)

					for index, inv in enumerate(invoices["data"]):
						invoice_list = {}
						invoice_list['index'] = index+1
						invoice_list['id'] = inv['id']
						invoice_list['created'] = datetime.fromtimestamp(int(inv["created"])).strftime('%d-%m-%Y')
						invoice_list['amount_remaining'] = cent_to_dollar(inv["amount_remaining"])			
						if inv["due_date"]:
							invoice_list["due_date"] = datetime.fromtimestamp(int(inv["due_date"])).strftime('%d-%m-%Y')
						else:
							invoice_list["due_date"] = inv["due_date"]
						invoice_list["paid"] = inv["paid"]
						invoice_list["status"] = inv["status"]
						
						unpaid_invoices.append(invoice_list)

			# print('/////////invoice list: ', unpaid_invoices)

			if not unpaid_invoices:
				return None
			return  unpaid_invoices		
		except Exception as e:
			print('exception : ', e)
			return None

	def invoice_items(self):

		agent_id = self.user.profile.agent_id

		try:

			#Query user invoices
			items = stripe.InvoiceItem.list(
				customer = agent_id,
				pending=True
				)	

			invoice_list = [
			[
				index+1,
				item["description"],
				datetime.fromtimestamp(int(item["date"])).strftime('%d-%m-%Y'),
				item["amount"]/100,			

			] 
			for index, item in enumerate(items["data"])]

			if not invoice_list:
				return None
			return  invoice_list		
		except Exception:
			return None

	def invoice_total_amount(self):

		agent_id = self.user.profile.agent_id

		try:

			invoices = stripe.Invoice.list(
				customer = agent_id,
				paid=False
				)	
			total_amount = 0
			for inv in invoices["data"]:
				total_amount += int(inv["amount_remaining"])			

			#Query user invoices
			# items = stripe.InvoiceItem.list(
			# 	customer = agent_id,
			# 	pending=True
			# 	)	
			# total_amount = 0
			# for item in items['data']:
			# 	total_amount += int(item['amount'])

			return  cent_to_dollar(total_amount)		
		except Exception:
			return None