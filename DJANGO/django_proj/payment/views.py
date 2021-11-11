from django.shortcuts import render, HttpResponse
import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from stripe.api_resources import payment_intent

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

    if event['type'] == 'customer.created':
        session = event['data']
        print(session)
        # customer_email = session['customer_details']['email']
        # payment_intent = session['payment_intent']
        return HttpResponse(status=200)

    if event['type'] == 'customer.deleted':
        session = event['data']
        print(session)
        # customer_email = session['customer_details']['email']
        # payment_intent = session['payment_intent']
        return HttpResponse(status=200)
    return HttpResponse(status=300)
