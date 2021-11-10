from django.contrib import messages
from django.urls import reverse_lazy as _
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from django.http.response import JsonResponse
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, CreateView, View
from django.views.generic.list  import MultipleObjectMixin
from tradies.decorators import role_required
from stage.models import Stage
from layer.models import Layer
from user.models import User
from tradies.models import Tradie
from stage.forms import StageCreateForm
from layer.forms import LayerCreateForm
from tradies.decorators import role_prohibited, role_required
from .models import Project
from .forms import ProjectCreateForm
from settings.models import SuperAdminSettings
from user.decorators import membership_required

# stripe imports
import stripe
from django.conf import settings
stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_PRIVATE_KEY
from settings.models import SuperAdminSettings
from payment.utils import cent_to_dollar, dollar_to_cent

# Create your views here.

class ProjectListView(ListView):
    '''ProjectListView
    Lists all the project asociated to the logged in user on the project/builder-dashboard.html template.
    '''
    model = Project
    template_name = 'project/builder-dashboard.html'
    paginate_by = 10
    ordering = ['id']

    def get_queryset(self):
        # queryset = Project.objects.filter(user=self.request.user, company=self.request.user.company).order_by('id')
        queryset = Project.objects.filter(company=self.request.user.company).order_by('-id')
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # sends ProjectCreateForm, total, active and inactive project count with the context data.
        context['add_form'] = ProjectCreateForm()
        context['project_count'] = Project.objects.filter(user=self.request.user, company=self.request.user.company).count()
        context['active_project_count'] = Project.objects.filter(status=True, user=self.request.user, company=self.request.user.company).count()
        context['inactive_project_count'] = Project.objects.filter(status=False, user=self.request.user, company=self.request.user.company).count()
        return context

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))
        return super().get(self, request, *args, **kwargs)

    @method_decorator([login_required])
    @role_prohibited(['superadmin'])
    @membership_required()
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

class ProjectCreateView(CreateView):
    '''ProjectCreateView
    this view creates a new Project.
    '''
    form_class = ProjectCreateForm
    template_name = 'project/add.html'
    success_url = _('list-project')
    
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('/user/'))
        return super().get(self, request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        if request.POST.get('id'):
            form = ProjectCreateForm(request.POST)
            if form.is_valid():
                id = request.POST.get('id')
                project = Project.objects.get(pk= id)
                project.name = request.POST.get('name')
                project.address = request.POST.get('address')
                project.email = request.POST.get('email')
                project.contact = request.POST.get('contact')
                project.status = True if request.POST.get('status') == 'on' else False
                project.company = request.user.company
                project.user = request.user
                project.horizontal_distance = request.POST.get('horizontal_distance')
                project.vertical_distance = request.POST.get('vertical_distance')
                project.horizontal_position = request.POST.get('horizontal_position')
                project.vertical_position = request.POST.get('vertical_position')
                project.save()
                messages.success(request, 'Project data was updated successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return redirect(_('list-project'))
        try:
            form = ProjectCreateForm(request.POST)
            if form.is_valid():
                obj = form.save(commit=False)
                obj.user = request.user
                obj.company = request.user.company
                obj.save()

                # stripe invoice generation
                #Create an invoice items for the transaction
                # invoice_item = stripe.InvoiceItem.create(
                #     customer= request.user.profile.agent_id,
                #     amount= dollar_to_cent(SuperAdminSettings.objects.first().project_rate),
                #     currency='USD',
                #     description= f'Project: {obj.name}'
                # )
                # print(invoice_item['id'])
                
                messages.success(request, 'Project was created successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
        except Exception as e:
            messages.error(request, f'Something went wrong! {e}')

        return redirect(_('list-project'))


@login_required()
def edit_project_view(request):
    '''edit_project_view
    this view returns JSON data to a ajax request to send project data 
    to the edit form of the tradie in list-project view without refreshing the page.
    '''
    if request.method == 'POST' and request.POST.get('id'):
        id = request.POST.get('id')
        project = Project.objects.get(pk=id)
        project_data = {
            'id': project.id,
            'name': project.name,
            'address': project.address,
            'email': project.email,
            'contact': project.contact,
            'status': project.status,
            'company': str(project.company.id),
            'horizontal_distance': project.horizontal_distance,
            'vertical_distance': project.vertical_distance,
            'horizontal_position': project.horizontal_position,
            'vertical_position': project.vertical_position,
        }
        return JsonResponse(project_data)

@login_required()
def delete_project_view(request, pk=None):
    '''delete_project_view
    this view takes primary key 'pk' as an extra parameter and deletes the 
    project asociated with the primary key requested from list-project view.
    '''
    if request.method == 'GET':
        try:
            project = Project.objects.get(pk=pk)
            project.delete()
            messages.success(request, 'Project deleted successfully.')
            return redirect(_('list-project'))
        except Exception:
            messages.success(request, 'Something went wrong.')
            return redirect(_('list-project'))


class ProjectDetailView(MultipleObjectMixin, View):
    ordering = ['id']

    @method_decorator([login_required, ])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    @role_prohibited(['superadmin'])
    @membership_required()
    def get(self, request, pk=None):
        if not request.user.is_authenticated and request.user.role.role_type != 'superadmin':
            return redirect(_('login'))
        
        context = {}
        if pk:
            try:
                project = Project.objects.get(pk=pk,company=request.user.company)
            except Exception:
                messages.error(request, '.Project not fount!')
                return redirect('list-project')

            stages = Stage.objects.filter(project=project).order_by('id')
            paginator = Paginator(stages, 10)
            page_number = request.GET.get('page')
            page_obj = paginator.get_page(page_number)
            context['page_obj'] = page_obj
            layers = Layer.objects.filter(project=project)

            context['project'] = project

            form = StageCreateForm()
            form.fields['tradie'].queryset = Tradie.objects.filter(company=request.user.company)
            form.fields['layer'].queryset = Layer.objects.filter(project=pk)
            context['stage_add_form'] = form
            context['layer_add_form'] = LayerCreateForm()
            context['stages'] = stages
            context['layers'] = layers
            sa_settings = SuperAdminSettings.objects.first()
            context['logo']  = sa_settings.logo
            context['qr_code_text']  = sa_settings.qr_code_text

            return render(request, 'project/edit-projects.html', context)
                




class SuperAdminProjectListView(ListView):
    model = Project
    template_name = 'project/super-admin-project-list.html'
    paginate_by = 10
    ordering = ['id']

    def get_queryset(self):
        queryset = Project.objects.filter().order_by('id')
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

    def get(self, request, pk=None, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))
        if pk:
            self.object_list = self.get_queryset()
            self.object_list = self.object_list.filter(user=pk)
            context = self.get_context_data()
            context['company'] = User.objects.get(pk=pk).company
            context['project_count'] = self.object_list.filter(user=pk).count()
            context['active_project_count'] = self.object_list.filter(user=pk, status=True).count()
            context['inactive_project_count'] = self.object_list.filter(user=pk, status=False).count()
            return self.render_to_response(context)
        return super().get(self, request, *args, **kwargs)

    @role_required(['superadmin'])
    @membership_required()
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)