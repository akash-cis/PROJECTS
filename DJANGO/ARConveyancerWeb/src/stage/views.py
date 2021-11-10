from tradies.models import Tradie
from django.shortcuts import render, redirect
from django.urls import reverse_lazy as _
from django.http.response import JsonResponse
from django.views.generic import ListView, CreateView
from project.models import Project
from layer.models import Layer
from layer.forms import LayerCreateForm
from django.contrib import messages
from .models import Stage
from .forms import StageCreateForm

# stripe imports
import stripe
from django.conf import settings
stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_PRIVATE_KEY
from settings.models import SuperAdminSettings
from payment.utils import cent_to_dollar, dollar_to_cent

# Create your views here.


class StageListView(ListView):
    '''StageListView
    List's all the stages in the list-stage.
    '''
    model = Stage
    template_name = 'project/edit-projects.html'
    paginate_by = 1
    ordering = ['id']


    def get_queryset(self):
        return Stage.objects.filter().order_by('-id')

    def get_context_data(self, **kwargs):
        context = super(StageListView, self).get_context_data(**kwargs)
        return context

    def get(self, request, pk=None, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))


        return super().get(self, request, *args, **kwargs)

class StageCreateView(CreateView):
    '''StageCreateView
    Creates or updates a stage using StageCreateForm
    '''
    model = Layer
    form_class = StageCreateForm
    template_name = 'satege/add.html'
    success_url = _('list-project')

    def post(self, request, *args, **kwargs):
        if request.POST.get('id'):
            form = StageCreateForm(request.POST)
            if form.is_valid():
                id = request.POST.get('id')
                stage = Stage.objects.get(pk= id)
                stage.name = request.POST.get('name')
                try:
                    tradie = Tradie.objects.get(pk=request.POST.get('tradie'))
                except Exception:
                    tradie = None
                stage.tradie = tradie
                try:
                    layer = Layer.objects.get(pk=request.POST.get('layer'))
                except Exception:
                    layer = None
                stage.layer = layer
                try:
                    project = Project.objects.get(pk=request.POST.get('project'))
                except Exception:
                    messages.error(request, 'Stage must be asigned to a project!')
                    return redirect(request.META.get('HTTP_REFERER'))
                stage.project = project
                stage.status = True if request.POST.get('status') == 'on' else False
                stage.save()

                messages.success(request, 'Stage data was updated successfully!')
                return redirect(request.META.get('HTTP_REFERER'))
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
                return redirect(request.META.get('HTTP_REFERER'))


        try:
            form = StageCreateForm(request.POST)
            if form.is_valid():
                stage = form.save()
                
                messages.success(request, 'Stage was creted successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
        except Exception as e:
            messages.error(request, f'Something went wrong! {e}')
        return redirect(request.META.get('HTTP_REFERER'))


def edit_stage_view(request):
    '''edit_stage_view
    this view returns JSON data to a ajax request to send stage data 
    to the edit form of the stage in list-project view without refreshing the page.
    '''
    if request.method == 'POST' and request.POST.get('id'):
        id = request.POST.get('id')
        stage = Stage.objects.get(pk=id)
        stage_data = {
            'id': stage.id,
            'name': stage.name,
            'tradie': str(stage.tradie.id) if stage.tradie else None,
            'layer': str(stage.layer.id) if stage.layer else None,
            'project': str(stage.project.id),
            'status': stage.status
        }
        return JsonResponse(stage_data)

def delete_stage_view(request, pk=None):
    '''delete_tradie_view
    this view takes primary key 'pk' as an extra parameter and deletes the 
    stage asociated with the primary key requested from list-project view.
    '''
    if request.method == 'GET':
        try:
            stage = Stage.objects.get(pk=int(pk))
            stage.delete()
            messages.success(request, 'Stage deleted successfully.')
            return redirect(request.META.get('HTTP_REFERER'))
        except Exception:
            messages.success(request, 'Something went wrong.')
            return redirect(request.META.get('HTTP_REFERER'))