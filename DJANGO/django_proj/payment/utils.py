import stripe
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse_lazy as _
from .models import History
from django.utils import timezone
from dateutil.relativedelta import relativedelta
import djstripe

stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeAccount():
    '''
    this class handles all the stripe customer profile related operation for a user such as Creating, updating or deleting user's stripe customer profile.
    '''

    def __init__(self, user):
        self.user = user

    def create(self):
        customer_account = stripe.Customer.create(
            email=self.user.email,
            address={
                "city":self.user.profile.city,
                "state":self.user.profile.state,
                "line1":self.user.profile.line1,
                "country":self.user.profile.country,
                "postal_code":self.user.profile.postal_code,
            },
            name=self.user.get_full_name(),
            phone=self.user.contact
        )
        self.user.stripe_id = customer_account["id"]
        self.user.save()
        djstripe_customer = djstripe.models.Customer.sync_from_stripe_data(customer_account)
        return customer_account

    def update(self):
        customer_account = stripe.Customer.modify(
            self.user.stripe_id,
            email=self.user.email,
            address={
                "city":self.user.profile.city,
                "state":self.user.profile.state,
                "line1":self.user.profile.line1,
                "country":self.user.profile.country,
                "postal_code":self.user.profile.potal_code,
            },
            name=self.user.get_full_name(),
            phone=self.user.contact
        )
        djstripe_customer = djstripe.models.Customer.sync_from_stripe_data(customer_account)
        return customer_account

    def delete(self):
        try:
            customer_account = stripe.Customer.delete(self.user.stripe_id)
            djstripe_customer = djstripe.models.Customer.sync_from_stripe_data(customer_account)
            return customer_account['deleted']
        except stripe.error.StripeError as e:
            message = 'Something went wrong while deleting the customer.'
            return message
        except Exception as e:
            return e

    def create_source(self, token):
        try:
            card = stripe.Customer.create_source(
                self.user.stripe_id,
                source = token
            )
            djstripe_card = djstripe.models.Card.sync_from_stripe_data(card)
        except stripe.error.StripeError as e:
            message = 'Something went wrong while creating the payment source.'
            return message
        except Exception as e:
            return e

    def delete_source(self, source):
        try:
            card = stripe.Customer.create_source(
                self.user.stripe_id,
                source = source
            )
            djstripe_card = djstripe.models.Card.sync_from_stripe_data(card)
        except stripe.error.StripeError as e:
            message = 'Something went wrong while deleting the payment source.'
            return message
        except Exception as e:
            return e


class StripePayment():
    '''
    this class will handle all sorts of payment business logics for the customer.
    '''

    def __init__(self, user, *args, **kwargs):
        self.user = user
        # self.user = kwargs.get("user")
        self.token = kwargs.get("token")
        self.save_card = kwargs.get("save_card")
        self.card_id = kwargs.get("card_id")
        self.description = kwargs.get("description")
        self.currency = kwargs.get("currency")
        self.set_default = kwargs.get("set_default")
        self.price = kwargs.get("price")

    def pay(self):
        pass

    @csrf_exempt
    def create_checkout_session(self):

        try:
            checkout_session = stripe.checkout.Session.create(
                # Customer Email is optional,
                # It is not safe to accept email directly from the client side
                customer_email = self.user.email,
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                            'name': self.description,
                            },
                            'unit_amount': int(self.price * 100),
                        },
                        'quantity': 1,
                    }
                ],
                mode='payment',
                # success_url=_('success', kwargs={'session_id':CHECKOUT_SESSION_ID}),
                success_url='/payment/success?session_id={CHECKOUT_SESSION_ID}',
                # cancel_url=_('failed'),
                cancel_url='payment/failed',
            )


            history = History()
            # history.user = self.user
            history.transaction_id = checkout_session['payment_intent']
            history.amount = int(self.price * 100)
            # history.status = 


            # return JsonResponse({'data': checkout_session})
            return JsonResponse({'sessionId': checkout_session.id})
        except Exception as e:
            print(e)


    # def create_subscription(self, price='price_1Jvwi5SHkX5AnUur9fUAbmMZ', trial_start=timezone.now().timestamp(), trial_end=(timezone.now() + relativedelta(days=7)).timestamp()):
    def create_subscription(self, price='price_1Jvwi5SHkX5AnUur9fUAbmMZ', trial_period_days=7):
        try:
            subscription = stripe.Subscription.create(
                customer=self.user.stripe_id,
                items=[
                    {
                    'price': price,
                    },
                ],
                trial_period_days=trial_period_days,
                # trial_start=trial_start,
                # trial_end=trial_end,
            )
            djstripe_card = djstripe.models.Subscription.sync_from_stripe_data(subscription)
            return subscription
        except stripe.error.StripeError as e:
            message = 'Something went wrong while deleting the payment source.'
            return message
        except Exception as e:
            return e
    
    def end_subscription(self):
        end_sub = stripe.Subscription.modify('sub_49ty4767H20z6a',
            trial_end='now',
        )
        return end_sub

    def create_price(self, product, unit_amount, currency='usd', recuring='month'):
        try:
            price = stripe.Price.create(
                unit_amount=unit_amount,
                currency=currency,
                recurring={"interval": recuring},
                product=product,
            )
            return price
        except Exception as e:
            print(e)
            return False

    def retrive_price(self, price_id):
        price = stripe.Price.retrieve(price_id)
        return price

    def update_price(self, price_id, unit_amount=None, active=True):
        p = stripe.Price.retrieve(price_id)
        price = stripe.Price.modify(
            price_id,
            unit_amount=unit_amount if unit_amount else p['unit_amount'],
        )
        return price

    def create_product(self, name):
        product = stripe.Product.create(
            name=name,
        )
        return product

    def update_product(self, product_id, name):
        product = stripe.Product.modify(
            product_id,
            name=name,
        )
        return product

    def retrive_product(self, product_id):
        product = stripe.Product.retrieve(product_id)
        return product

    def delete_product(self, product_id):
        product = stripe.Product.delete(product_id)
        return product