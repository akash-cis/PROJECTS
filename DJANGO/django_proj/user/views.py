import stripe
from django.shortcuts import redirect, render
from django.views.generic import TemplateView
from .forms import ParentForm, StudentForm
from django.contrib import messages
from django.conf import settings
from django.db import transaction
from django.utils.decorators import method_decorator
from payment.utils import StripeAccount, StripePayment
from django.contrib.auth.views import LoginView
from .decorators import subscription_required

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



def index(request):
    return render(request, 'index.html')

@subscription_required
def lessons(request):
    return render(request, 'index.html')