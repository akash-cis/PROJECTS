import stripe
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse_lazy as _
from django.views import View
from company.models import Company

from .mixins import StripeAccount, StripeData, StripePayment
from .models import Invoice
from django.conf import settings
stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_PRIVATE_KEY
from settings.models import SuperAdminSettings
from payment.utils import cent_to_dollar, dollar_to_cent
from project.models import Project
from layer.models import Layer

stripe.api_key = "sk_test_51JN9rLSELLTVTa8q8cNF9pZn0xHZD9zmeFolwkFPEAREBul3GdtPdPmsUNzY0JTtVxVJOIVFWaeQmYBiVf2xQMqr00HN4aq9RD"


# Create your views here.
class PaymentView(View):

    # def get_context_data(self, **kwargs):
    #     context = super().get_context_data(**kwargs)
    #     return context

    def get(self, request, *args, **kwargs):
        # test_func.delay()
        if not request.user.is_authenticated:
            return redirect(_('login'))


        user = request.user
        if user.role.role_type != 'builder':
            from user.models import Role, User
            b_role = Role.objects.get(role_type='builder')
            user = User.objects.get(company=user.company, role=b_role)
    
        projects = Project.objects.filter(user = user, status=True)
        total = 0
        p_rate = SuperAdminSettings.objects.first().project_rate
        l_rate = SuperAdminSettings.objects.first().layer_rate
        layers = []
        for project in projects:
            ls = Layer.objects.filter(project=project)
            total += p_rate
            for l in ls:
                total += l_rate
                layers.append(l)

        context = {}
        cards = StripeData(user).cards()
        invoices = StripeData(user).invoices(['draft','open'])
        # invoice_items = StripeData(user).invoice_items()
        invoice_total_amount = StripeData(user).invoice_total_amount()
        # invoice_total_amount = float(total)
        # context["invoice_items"] = invoice_items
        context["cards"] = cards
        context["invoices"] = invoices
        context["next_invoice_amount"] = float(total)
        context["invoice_total_amount"] = invoice_total_amount
        return render(request, 'payment/payment.html', context)

    def post(self, request, *args, **kwargs):
        print('-------------DATA', request.POST)


        # VARIABLES
        user = request.user
        if user.role.role_type != 'builder':
            from user.models import Role, User
            b_role = Role.objects.get(role_type='builder')
            user = User.objects.get(company=user.company, role=b_role)
        if not user.profile.address or not user.profile.city or not user.profile.state or not user.profile.postal_code:
            messages.error(request, f'Please Fill your address in settings before proceding with the payment.')
            return redirect(_('account-settings'))
        agent_id = user.profile.agent_id
        token = request.POST.get('stripeToken',None)
        card_id = request.POST.get("card_id", None)
        save_card = request.POST.get('save_card', None)
        paymentmethodnonce = request.POST.get("paymentMethodNonce", None)
        description = request.POST.get("description", 'Project Services.')
        set_default = request.POST.get("set_default", None)
        currency = 'USD'

        if 'delete_card' in request.POST:
            card = stripe.Customer.delete_source(
                agent_id,
                card_id,
            )
            if card['deleted'] == True:
                messages.success(request, f'Card Deleted')
            else:
                messages.success(request, f'Something went wrong')

            return redirect(_('payment'))


        invoice_total_amount = StripeData(user).invoice_total_amount()
        if invoice_total_amount == 0:
            messages.error(request, f'No amount to be paid.')
            return redirect(_('payment'))


        if not agent_id:
            StripeAccount(user).create()

        payment = StripePayment(
            user=user,
            agent_id=agent_id,
            token=token,
            card_id=card_id,
            save_card=save_card,
            description=description,
            currency=currency,
            set_default=set_default,
        ).pay_unpaid_invoices()

        if payment['message'] == 'Perfect':
            if user.membership == 'expired' and StripeData(user).invoice_total_amount() == 0:
                user.membership = 'active'
                user.save()


            messages.success(request, 'Payment was successful.')
        else:
            messages.error(request, f'Payment Failed. {payment["message"]}')

        return redirect(_('payment'))


class CardCreateView(View):

    def post(self, request, *args, **kwargs):
        print('-------------DATA', request.POST)
        # VARIABLES
        user = request.user
        source = request.POST.get('stripe_source',None)
        token = request.POST.get('stripeToken',None)
        print('-------source: ',source)

        card = stripe.Customer.create_source(
            user.profile.agent_id,
            source=token
        )

        if card:
            print('-------card: ',card)
            messages.success(request, 'Card created.')
        else:
            messages.error(request, f'Something went wrong.')

        return redirect(_('payment'))



def payment_success(request):
    return render(request, 'payment/success.html')

def payment_cancel(request):
    return render(request, 'payment/cancel.html')




from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy as _
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.generic import ListView
from .models import Invoice
from tradies.decorators import role_required, role_prohibited

class InvoiceListView(ListView):
    '''this view lists all the tradies.'''
    model = Invoice
    template_name = 'payment/invoice-list.html'
    paginate_by = 10
    ordering = ['id']

    @method_decorator([login_required, ])
    # @role_prohibited(['superadmin'])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        if self.request.user.is_superuser:
            queryset = Invoice.objects.all().order_by('-timestamp')
        else:
            queryset = Invoice.objects.filter(company=Company.objects.get(user=self.request.user)).order_by('-timestamp')
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # context data for authenticated users company, total, active and inactive tradie count to display on the page.
        if self.request.user.is_superuser:
            context['invoice_count'] = Invoice.objects.filter().count()
            context['paid_invoice_count'] = Invoice.objects.filter(paid=True).count()
            context['unpaid_invoice_count'] = Invoice.objects.filter(paid=False).count()
        else:
            context['invoice_count'] = Invoice.objects.filter(company=Company.objects.get(user=self.request.user)).count()
            context['paid_invoice_count'] = Invoice.objects.filter(paid=True, company=Company.objects.get(user=self.request.user)).count()
            context['unpaid_invoice_count'] = Invoice.objects.filter(paid=False, company=Company.objects.get(user=self.request.user)).count()
        return context

    def get(self, request, *args, **kwargs):
        
        if not request.user.is_authenticated:
            return redirect(_('login'))
        return super().get(self, request, *args, **kwargs)

