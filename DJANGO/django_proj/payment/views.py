from django.shortcuts import render, HttpResponse
import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from stripe.api_resources import payment_intent

from user.models import Parent
from .utils import StripeAccount, StripeInfo, StripePayment


# Create your views here.
@csrf_exempt
def webhook(request):
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']
    event = None
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return HttpResponse(status=404)
    except stripe.error.SignatureVerificationError as e:
        return HttpResponse(status=404)

    print(event['type'])
    print('---------------------------------')
    # CUSTOMER
    if event['type'] == 'customer.created':
        session = event['data']
        print(session)
        # customer_email = session['customer_details']['email']
        # payment_intent = session['payment_intent']
        return HttpResponse(status=200)
    if event['type'] == 'customer.updated':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'customer.deleted':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'customer.subscription.created':
        # inform the user that trial will end soon and then will be charged soon.
        session = event['data']
        obj = session['object']
        customer_id = obj['customer']
        
        parent = Parent.objects.get(stripe_id=customer_id)
        parent.subscription_status = obj['status']
        parent.save()
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'customer.subscription.trial_will_end':
        # inform the user that trial will end soon and then will be charged soon. occures 3 days before a subscription's trial period.
        session = event['data']
        obj = session['object']
        prevattrs = session['previous_attributes']
        print('---------------------------------')
        # print(obj)

        print(f'3 days left for your free trial to expire! Subscription id: {obj["id"]}')
        customer_id = obj['customer']
        product_id = obj['plan']['product']
        product = StripeInfo().retrieve_product(product_id)
        parent = Parent.objects.get(stripe_id=customer_id)
        parent.send_email(
            subject='Your free trial is expiring soon!', 
            message=f'Hello {parent.get_full_name()}, your free trial for "{product["name"]}" subscription is going to expire soon.',
            email_template='user/email/simple_mail.html')

        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'customer.subscription.past_due':
        session = event['data']
        print(session)
        # inform user about the payment is past due and request for making the payment
        return HttpResponse(status=200)
    if event['type'] == 'customer.subscription.updated':
        # inform user that their subscription has been updated.
        session = event['data']
        obj = session['object']
        prevattrs = session['previous_attributes']
        print('---------------------------------')
        # print(obj)

        if 'status' in prevattrs and prevattrs['status'] == 'active' and obj['status'] == 'past_due':
            print(f'A subscription payment has failed! Subscription id: {obj["id"]}')
            customer_id = obj['customer']
            product_id = obj['plan']['product']
            product = StripeInfo().retrieve_product(product_id)
            parent = Parent.objects.get(stripe_id=customer_id)
            parent.subscription_status = obj['status']
            parent.save()
            parent.send_email(
                subject='Your subscription payment has failed!', 
                message=f'Hello {parent.get_full_name()}, An automatic payment for your subscription to "{product["name"]}" has failed.' + 
                        'Please log in and update your payment information to ensure your subscription remains valid.',
                email_template='user/email/simple_mail.html')

        print('---------------------------------')
        # print(session)
        return HttpResponse(status=200)
    if event['type'] == 'customer.subscription.deleted':
        session = event['data']
        print(session)
        obj = session['object']
        customer_id = obj['customer']
        product_id = obj['plan']['product']
        try:
            product = StripeInfo().retrieve_product(product_id)
            print('obj-------------------------')
            print(obj)
            parent = Parent.objects.get(stripe_id=customer_id)
            print('parent-------------------------')
            print(parent)
            parent.subscription_status = obj['status']
            parent.save()
            parent.send_email(
                subject='Your subscription has been cancled!', 
                message=f'Hello {parent.get_full_name()}, your subscription for "{product["name"]}" has has been canceled.' + 
                        'If you wish to reuse the services please complete the subscription payment procedure.',
                email_template='user/email/simple_mail.html')
        except Exception as e:
            print(e)
        # inform user that their subscription has been deleted.
        return HttpResponse(status=200)


    # SOURCE
    if event['type'] == 'source.chargeable':
        # Occurs whenever a source transitions to chargeable.
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'source.failed':
        # Occurs whenever a source fails.
        session = event['data']
        print(session)
        return HttpResponse(status=404)
    if event['type'] == 'source.canceled':
        # Occurs whenever a source is canceled.
        session = event['data']
        print(session)
        return HttpResponse(status=404)

    # SUBSCRIPTION
    if event['type'] == 'subscription_schedule.aborted':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'subscription_schedule.cancled':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'subscription_schedule.created':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'subscription_schedule.completed':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'subscription_schedule.expiring':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'subscription_schedule.released':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'subscription_schedule.updated':
        session = event['data']
        print(session)
        # print(session['previous_attributes'])
        return HttpResponse(status=200)
        

    # INVOICE
    if event['type'] == 'invoice.created':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'invoice.paid':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'invoice.deleted':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'invoice.finalization_failed':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'invoice.finalized':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'invoice.payment_action_required':
        session = event['data']
        print(session)
        return HttpResponse(status=200)
    if event['type'] == 'invoice.payment_failed':
        session = event['data']
        print(session)
        return HttpResponse(status=200)

    return HttpResponse(status=200)
