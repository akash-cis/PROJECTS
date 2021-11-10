from django.core.checks.messages import INFO
from django.http import HttpResponse
from django.http import response
from django.http.response import HttpResponseRedirect, JsonResponse
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy as _
from django.contrib import messages
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from django.urls.base import reverse
from django.views.generic import CreateView, UpdateView, DeleteView, ListView
from django.template.loader import render_to_string
from AR import settings
from .models import Tradie
from .forms import TradieCreateForm
from company.models import Company
from .decorators import role_required, role_prohibited
from user.decorators import membership_required
# Create your views here.

class TradieListView(ListView):
    '''this view lists all the tradies.'''
    model = Tradie
    template_name = 'tradies/list.html'
    paginate_by = 10
    ordering = ['id']

    @method_decorator([login_required, ])
    @role_prohibited(['superadmin'])
    @membership_required()
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        try:
            queryset = Tradie.objects.filter(company=Company.objects.get(user=self.request.user)).order_by('-id')
        except:
            queryset = Tradie.objects.filter()
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # context data for authenticated users company, total, active and inactive tradie count to display on the page.
        context['add_form'] = TradieCreateForm()
        context['company'] = Company.objects.get(user=self.request.user)
        context['tradie_count'] = Tradie.objects.filter(company=Company.objects.get(user=self.request.user)).count()
        context['active_tradie_count'] = Tradie.objects.filter(status=True, company=Company.objects.get(user=self.request.user)).count()
        context['inactive_tradie_count'] = Tradie.objects.filter(status=False, company=Company.objects.get(user=self.request.user)).count()
        return context

    def get(self, request, *args, **kwargs):
        
        if not request.user.is_authenticated:
            return redirect(_('login'))
        return super().get(self, request, *args, **kwargs)


class TradieCreateView(CreateView):
    '''this view creates a new Tradie.'''
    form_class = TradieCreateForm
    template_name = 'tradies/add.html'
    success_url = _('list-tradie')

    @method_decorator([login_required, ])
    @membership_required()
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('/user/')
        return super().get(self, request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        if request.POST.get('id'):
            id = request.POST.get('id')
            tradie_instance = Tradie.objects.get(pk=id)
            form = TradieCreateForm(data=request.POST, instance=tradie_instance)
            if form.is_valid():
                form.save()
                messages.success(request, 'Tradie was updated successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')

            return redirect(_('list-tradie'))
        try:
            form = TradieCreateForm(request.POST)
            if form.is_valid():
                form.save()
                messages.success(request, 'Tradie was created successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return redirect(_('list-tradie'))
        except Exception as e:
            messages.error(request, 'Something went wrong!', e)
        return redirect(_('list-tradie'))

# class TradieUpdateView(UpdateView):
#     '''This view updates a existing tradie.'''
#     model = Tradie
#     template_name = 'tradies/add.html'
#     success_url = _('list-tradie')
#     fields = ['name','email','contact','status','company']


# class TradieDeleteView(DeleteView):
#     '''This view deletes a tradie.'''
#     model = Tradie
#     template_name = 'tradies/delete.html'
#     success_url = _('list-tradie')

@login_required()
def invite_tradie(request, pk):
    '''This view sends an invitation email to the tradie.'''
    tradie = Tradie.objects.get(pk=pk)
    raw_password = tradie.make_random_password() # Generating a random password for tradie.
    tradie.set_password(raw_password) # Saving tradie password
    tradie.save()

    try:
        # Rendering username and password into email.
        message = render_to_string('emails/tradie_invitation.html',{
                'username': tradie.email,
                'password': raw_password
            })

        # Sending invitation email to the tradie.
        send_mail(
            subject='Account Invitation',
            message=message,
            html_message=message,
            from_email= settings.EMAIL_HOST_USER,
            recipient_list=[tradie.email, ],
            fail_silently=False,
        )
        messages.success(request, 'Email was sent successfully To the tradie! check your inbox or spam.')
    except Exception as e:
        print(e)
        messages.error(request, "Email wasn't sent successfully To the tradie!", e)

    return redirect(_('list-tradie'))    

@login_required()
def edit_tradie_view(request):
    '''edit_tradie_view
    this view returns JSON data to a ajax request to send tradie data 
    to the edit form of the tradie in list-tradie view without refreshing the page.
    '''
    if request.method == 'POST' and request.POST.get('id'):
        id = request.POST.get('id')
        tradie = Tradie.objects.get(pk=id)
        tradie_data = {
            'id': tradie.id,
            'name': tradie.name,
            'email': tradie.email,
            'contact': tradie.contact,
            'status': tradie.status,
            'company': str(tradie.company.id),
        }
        return JsonResponse(tradie_data)


@login_required()
def delete_tradie_view(request, pk=None):
    '''delete_tradie_view
    this view takes primary key 'pk' as an extra parameter and deletes the 
    tradie asociated with the primary key requested from list-tradie view.
    '''
    if request.method == 'GET':
        try:
            tradie = Tradie.objects.get(pk=pk)
            tradie.delete()
            messages.success(request, 'Tradie deleted successfully.')
            return redirect('/tradies/list/')
        except Exception:
            messages.success(request, 'Something went wrong.')
            return redirect('/tradies/list/')