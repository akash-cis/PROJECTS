from django.views.generic.base import View
import stripe
from django.shortcuts import redirect, render
from django.views.generic import TemplateView
from .forms import ParentForm, StudentForm
from django.contrib import messages
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils.decorators import method_decorator
from payment.utils import StripeAccount, StripeData, StripeInfo, StripePayment
from django.contrib.auth.views import LoginView
from .decorators import subscription_required
from django.urls import reverse_lazy as _

stripe.api_key = settings.STRIPE_SECRET_KEY
# Create your views here.


class RegistrationView(TemplateView):
    template_name = 'user/register.html'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('index')
        return self.render_to_response({'parentform': ParentForm(prefix='parent_'), 'studentform': StudentForm(prefix='student_')})

    def post(self, request, *args, **kwargs):
        token = request.POST.get('stripeToken',None)
        print(token)
        if token:
            parentform = ParentForm(request.POST, prefix='parent_')
            studentform = StudentForm(request.POST, prefix='student_')
            if (parentform.is_bound and parentform.is_valid()) and (studentform.is_bound and studentform.is_valid()):
                print(parentform.cleaned_data['first_name'])
                print(studentform.cleaned_data['first_name'])

                parent = parentform.save()
                student = studentform.save(False)
                student.parent = parent
                student.save()
                print(parent.stripe_id)
                StripeAccount(parent).create_source(token)
                StripePayment(parent).create_subscription()
                
                messages.success(request, 'parent and student created.')
            else:
                messages.warning(request, 'parent and student not created.')
        else:
            messages.warning(request, 'Please provide payment details.')
            

        return self.render_to_response({'parentform': parentform, 'studentform': studentform})



@login_required
def index(request):
    return render(request, 'index.html')

@login_required
@subscription_required
def lessons(request):
    return render(request, 'lessons.html')

@login_required
@subscription_required
def cancel_subscription(request):
    resp = StripePayment(request.user).cancel_subscription(request.user.subscription_id)
    if type(resp) == str:
        messages.error(request, resp)
    else:
        messages.info(request, 'Your subscription cancled successfully.')

    return redirect('index')
    # return render(request, 'index.html')


class SubscribeView(View):

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


    def get(self, request, *args, **kwargs):
        context = {}

        if request.user.subscription_id:
            subscription = StripeInfo().retrieve_subscription(request.user.subscription_id)
            context["price_id"] = subscription['items']['data'][0]['plan']['id']

        context["cards"] = StripeData(request.user).cards()
        context["invoices"] = StripeData(request.user).invoices()
        context["prices"] = StripeInfo().list_price()
        return render(request, 'user/subscribe.html', context)

    def post(self, request, *args, **kwargs):
        token = request.POST.get('stripeToken',None)
        card_id = request.POST.get("card_id", None)
        price_id = request.POST.get('price_id')
        save_card = request.POST.get('save_card',  None)
        payment_card = request.POST.get('payment_card',  None)
        upgrade_subscription = request.POST.get('upgrade_subscription',  None)
        subscribe = request.POST.get('subscribe',  None)
        # print('token: ', token)
        # print('card_id: ', card_id)
        # print('price_id: ', price_id)
        # print('save_card: ', save_card)
        # print('payment_card: ', payment_card)
        # print('upgrade_subscription: ', upgrade_subscription)
        # print('save_card: ', save_card)
        # print('subscribe: ', subscribe)
        # print(request.POST)

        if 'save_card' in request.POST:
            resource = StripeAccount(request.user).create_source(token)
            print(resource['id'])
            if 'id' in resource:
                messages.success(request, 'Card was saved successfully!')
            else:
                messages.error(request, resource)
            return redirect(_('subscribe'))


        if 'upgrade_subscription' in request.POST:
            subscription = StripePayment(request.user).modify_subscription(price_id=upgrade_subscription)
            print(subscription)
            try:
                if subscription['id']:
                    request.user.subscription_status = subscription['status']
                    request.user.save()
                    messages.success(request, f'Your subscription has been chagned!')
            except Exception as e:
                messages.success(request, f'Something went wrong! {e}')
            return redirect(_('subscribe'))


        if 'delete_card' in request.POST:
            card = StripeAccount(request.user).delete_source(card_id)
            print(card)
            if 'deleted' in card:
                if card['deleted'] == True:
                    messages.success(request, f'Card Deleted')
                else:
                    messages.success(request, f'Something went wrong')
                return redirect(_('subscribe'))


        if 'subscribe' in request.POST:
            customer = StripeInfo().retrieve_customer(request.user.stripe_id)
            if payment_card:
                subscription = StripePayment(request.user).create_subscription(price=subscribe, default_payment_method=payment_card)
            if not customer["default_source"] and token:
                source = StripeAccount(request.user).create_source(token)
                subscription = StripePayment(request.user).create_subscription(price=subscribe, default_payment_method=source['id'])
            if 'id' in subscription:
                messages.success(request, 'Subscription successful!')
            else:
                messages.success(request, f'Something went wrong! {subscription}')


        return redirect(_('subscribe'))

