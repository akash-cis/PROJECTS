from project.models import Project
from django.shortcuts import render, redirect
from django.http.response import JsonResponse
from django.views.generic import CreateView
from django.urls import reverse_lazy as _
from django.contrib import messages
from .models import Layer
from .forms import LayerCreateForm
from AR.settings import BASE_DIR, MEDIA_ROOT

import stripe
from django.conf import settings
stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_PRIVATE_KEY
from settings.models import SuperAdminSettings
from payment.utils import cent_to_dollar, dollar_to_cent

# Create your views here.

class LayerCreateView(CreateView):
    '''LayerCreateView
    this view creates a new layer.
    '''
    model = Layer
    form_class = LayerCreateForm
    template_name = 'layer/add.html'
    success_url = _('list-project')


    def post(self, request, *args, **kwargs):
        try:
            form = LayerCreateForm(request.POST, request.FILES)
            if form.is_valid():
                layer = form.save()
                print('--------layer',layer)
                # stripe invoice generation
                #Create an invoice items for the transaction
                # invoice_item = stripe.InvoiceItem.create(
                #     customer= request.user.profile.agent_id,
                #     amount= dollar_to_cent(SuperAdminSettings.objects.first().layer_rate),
                #     currency='USD',
                #     description= f'Project: {layer.project} Layer: {layer}'
                # )
                
                messages.success(request, 'Layer was creted successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
        except Exception as e:
            messages.error(request, f'Something went wrong! {e}')
        return redirect(request.META.get('HTTP_REFERER'))


def layer_create_view(request):
    '''LayerCreateView
    this view creates a new layer.
    '''
    if request.method == 'POST':
        form = LayerCreateForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()
            messages.success(request, 'file added successfully!')
        else:
            messages.error(request, form.errors)
        return redirect(request.META.get('HTTP_REFERER'))


def delete_layer_view(request, pk=None):
    '''delete_layer_view
    this view takes primary key 'pk' as an extra parameter and deletes the 
    layer asociated with the primary key requested from list-project view.
    '''
    if request.method == 'GET':
        try:
            layer = Layer.objects.get(pk=pk)
            layer.delete()
            messages.success(request, 'Layer deleted successfully.')
            import os
            for root, dirs, files in os.walk(MEDIA_ROOT):
                for d in dirs:
                    dir = os.path.join(root, d)
                    # check if dir is empty
                    if not os.listdir(dir):
                        os.rmdir(dir)
            return redirect(request.META.get('HTTP_REFERER'))
        except Exception:
            messages.error(request, 'Something went wrong.')
            return redirect(request.META.get('HTTP_REFERER'))