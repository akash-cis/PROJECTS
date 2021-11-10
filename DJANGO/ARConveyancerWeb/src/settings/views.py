from django.shortcuts import render
from django.contrib import messages
from django.views.generic import UpdateView
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy as _

from .forms import SuperAdminSettingsForm
from .models import SuperAdminSettings
from tradies.decorators import role_required
# Create your views here.
class SuperAdminSettingsView(UpdateView):
    model = SuperAdminSettings
    form_class = SuperAdminSettingsForm
    template_name = 'settings/super-admin-settings.html'
    success_url = _('super-admin-settings')

    @method_decorator([login_required,])
    @role_required(['superadmin'])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_object(self):
        return SuperAdminSettings.objects.get(pk=1)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        sa_settings = SuperAdminSettings.objects.first()
        context['sa_logo']  = sa_settings.logo
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()
        if form.is_valid():
            messages.success(request, "Settings saved!")
            return self.form_valid(form)
        else:
            for item in form.errors.items():
                messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return self.form_invalid(form)

