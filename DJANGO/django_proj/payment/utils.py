import stripe
from django.conf import settings
from stripe.api_resources import customer

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
                "postal_code":self.user.profile.potal_code,
            },
            name=self.user.get_full_name(),
            phone=self.user.contact
        )
        self.user.stripe_id = customer_account["id"]
        self.user.save()
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
        return customer_account

    def delete(self):
        try:
            customer_account = stripe.Customer.delete(self.user.stripe_id)
            return customer_account['deleted']
        except stripe.error.StripeError as e:
            message = 'Something went wrong while deleting the customer.'
            return message
        except Exception as e:
            return e


class StripePayment():
    '''
    this class will handle all sorts of payment business logics for the customer.
    '''

    def __init__(self, *args, **kwargs):
        self.user = kwargs.get("user")
        self.token = kwargs.get("token")
        self.save_card = kwargs.get("save_card")
        self.card_id = kwargs.get("card_id")
        self.description = kwargs.get("description")
        self.currency = kwargs.get("currency")
        self.set_default = kwargs.get("set_default")
