from django.http import response
from django.views import View
from django.utils import timezone
from django.contrib import messages
from django.urls import reverse_lazy as _
from django.http.response import JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.utils.decorators import method_decorator
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, CreateView, UpdateView
from django.contrib.auth.views import (
    LoginView as DjangoLoginView, 
    PasswordChangeView, 
    PasswordChangeDoneView, 
    PasswordResetView as DjangoPasswordResetView, 
    PasswordResetConfirmView as DjangoPasswordResetConfirmView
)
from company.models import Company
from tradies.decorators import role_required
from .forms import (
    PasswordResetForm,
    ProfileForm, 
    SuperAdminChangeForm, 
    SuperAdminCreateForm, 
    UserLoginForm, 
    UserCreationForm, 
    BuilderAdminCreateForm, 
    CustomPasswordChangeForm, 
    BuilderCreateForm, 
    UserChangeForm, 
    UserSetPasswordForm,
    UserUpdateForm
)
from .models import Profile, User, Role
from .decorators import superuser_required, membership_required
# Create your views here.


class RegisterView(CreateView):
    '''User Create View
        This view is rendered when signup/ page is called. 
        After the successful registration it redirects the user to login page.
        User Created from this view are by default "Builders" and are allowed to login
    '''
    form_class = UserCreationForm
    template_name = 'user/sign-up.html'
    success_url = _('login')

    def get(self, request):
        if request.user.is_authenticated:
            storage = messages.get_messages(request)
            storage.used = True
            return redirect(_('login'))
        return super().get(self, request)


class LoginView(DjangoLoginView):
    '''User Login View
        This view is rendered when login/ page is called.
        It only allows Type of "Builder" or "Master Admin" to login.
    '''
    form_class = UserLoginForm
    model = User
    template_name = 'user/login.html'
    success_url = _('builder-admin')

    def get(self, request, *args, **kwargs):
        context = {'form':UserLoginForm}
        if request.user.is_authenticated:
            return redirect(_('builder-admin'))
        return render(request,"user/login.html", context)
    
    def post(self, request, *args, **kwargs):
        try:
            # Check if the user is allowed to login or not
            roles = list(Role.objects.all())
            role_types = list()
            for role in roles:
                role_types.append(str(role))
            user = User.objects.get(email=request.POST['username'])
            if user.role.role_type in role_types:
                user.last_login = timezone.now()
            else:
                messages.warning(request, 'Only Builders are allowed to login.')
                return redirect(request.META.get('HTTP_REFERER'))
        except Exception:
            messages.warning(request, 'Please Enter a valid Email and password.')
            return redirect(request.META.get('HTTP_REFERER'))
        return super().post(request, *args, **kwargs)


class DashboardView(View):
    '''DashboardView : redirects every user to their respective authorised page.'''
    def get(self,request,*args,**kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))
        else:
            if str(request.user.role) == 'superadmin':
                return redirect(_('super-admin'))
            if request.user.membership == 'expired':
                return redirect(_('payment'))
            else:
                if str(request.user.role) == 'builder':
                    return redirect(_('builder-admin'))
                if str(request.user.role) not in ['builder', 'superuser']:
                    return redirect(_('list-tradie'))
        
        return redirect(_('login'))


class BuilderAdminListView(ListView):
    '''this view lists all the users.'''
    model = User
    template_name = 'builder-admin.html'
    paginate_by = 10
    ordering = ['id']

    
    @method_decorator([login_required, ])
    @role_required(['builder', 'superadmin'])
    @membership_required()
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        queryset = User.objects.filter(company=self.request.user.company).exclude(id=self.request.user.id).order_by('-id')
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['add_form'] = BuilderCreateForm(**kwargs)
        context['active_user_count'] = User.objects.filter(is_active=True, company=self.request.user.company).exclude(id=self.request.user.id).count()
        context['inactive_user_count'] = User.objects.filter(is_active=False, company=self.request.user.company).exclude(id=self.request.user.id).count()
        return context

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))
        if request.user.is_superuser:
            return redirect(_('super-admin'))
        return super().get(self, request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        
        if not request.user.is_authenticated:
            return redirect(_('login'))
        
        company = Company.objects.get(user=request.user)
        request.POST['company'] = company
        return super().post(self, request, *args, **kwargs)

    

class BuilderAdminCreateview(CreateView):
    '''User Create View
        This view is rendered when signup/ page is called. 
        After the successful registration it redirects the user to login page.
        User Created from this view are by default "Builders" and are allowed to login
    '''
    form_class = BuilderCreateForm
    template_name = 'project/add.html'
    success_url = _('builder-admin')

    @method_decorator([login_required, ])
    @role_required(['builder', 'superadmin'])
    @membership_required()
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


    def get(self, request):
        if request.user.is_authenticated:
            storage = messages.get_messages(request)
            storage.used = True
            return redirect(_('builder-admin'))
        return super().get(self, request)

    def post(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))

        if request.POST.get('id'):
            id = request.POST.get('id')
            user = User.objects.get(pk= id)
            form = UserChangeForm(instance=user, data=request.POST)
            if form.is_valid():
                user.first_name = request.POST.get('first_name')
                user.last_name = request.POST.get('last_name')
                user.email = request.POST.get('email')
                user.contact = request.POST.get('contact')
                user.is_active = True if request.POST.get('is_active') == 'on' else False
                user.company = request.user.company
                role = Role.objects.get(pk=request.POST.get('role'))
                user.role = role
                user.save()
                messages.success(request, 'User data was updated successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return redirect(_('builder-admin'))

        try:
            form = BuilderCreateForm(request.POST)
            if form.is_valid():
                form.save()
                messages.success(request, 'User was created successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
        except Exception as e:
            messages.error(request, f'Something went wrong! {e}')
        return redirect(_('builder-admin'))


@login_required()
def edit_user_view(request):
    '''edit_user_view
    this view returns JSON data to a ajax request to send user data 
    to the edit form of the user in builder-admin view without refreshing the page.
    '''
    if request.method == 'POST' and request.POST.get('id'):
        id = request.POST.get('id')
        user = User.objects.get(pk=id)
        user_data = {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'contact': user.contact,
            'is_active': user.is_active,
            'company': str(user.company.id),
            'role': str(user.role.id),
        }
        return JsonResponse(user_data, safe=False)


@login_required()
def delete_user_view(request, pk=None):
    '''delete_user_view
    this view takes primary key 'pk' as an extra parameter and deletes the 
    user asociated with the primary key requested from builder-admin view.
    '''
    if request.method == 'GET':
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            messages.success(request, 'User deleted successfully.')
            return redirect(_('builder-admin'))
        except Exception:
            messages.error(request, 'Something went wrong.')
            return redirect(_('builder-admin'))


class UserPasswordChangeView(PasswordChangeView):
    '''UserPasswordChabngeView
    this view is used to render change password form.'''
    template_name = 'user/password-change.html'
    form_class = CustomPasswordChangeForm
    success_url = _('password-change-done')

class UserPasswordResetView(DjangoPasswordResetView):
    '''UserPasswordResetView
    This view is used as forgot password system.
    it renders PasswordResetForm which has 1 field email that will be used to send a reset password email.
    '''
    form_class = PasswordResetForm

class UserPasswordResetConfirmView(DjangoPasswordResetConfirmView):
    '''UserPasswordResetView
    This view is used as forgot password system.
    it renders UserSetPasswordForm which has 2 field 'new password' and 'confirm password' that will be used to set a new password.
    this view will be accesible by the link sent to the email by the UserPasswordResetView().
    '''
    form_class = UserSetPasswordForm

@superuser_required()
class SuperAdminDashboardView(ListView):
    '''SuperAdminDashboardView
    this view lists all the builders in a view where only superadmin type users are allowed to view..'''
    model = User
    template_name = 'super-admin.html'
    paginate_by = 10
    ordering = ['id']
    
    @method_decorator([login_required, ])
    @role_required(['superadmin'])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        role = Role.objects.get(role_type='builder')
        queryset = User.objects.filter(role=role).order_by('-id')
        return queryset

    def get_context_data(self, **kwargs):
        role = Role.objects.get(role_type='builder')
        context = super().get_context_data(**kwargs)
        context['add_form'] = SuperAdminCreateForm(**kwargs)
        context['active_user_count'] = User.objects.filter(is_active=True, role=role).count()
        context['inactive_user_count'] = User.objects.filter(is_active=False, role=role).count()
        return context

    def get(self, request, *args, **kwargs):
        
        if not request.user.is_authenticated:
            return redirect(_('login'))
        return super().get(self, request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        
        if not request.user.is_authenticated:
            return redirect(_('login'))
        return super().post(self, request, *args, **kwargs)

@superuser_required()
class SuperAdminCreateview(CreateView):
    '''Super Admin Create View
        This view is rendered with superadminlistview when super-admin url is accessed. 
        super admin can create builder type users with this view
        User Created from this view are by default "Builders" and are allowed to login
    '''
    form_class = SuperAdminCreateForm
    template_name = 'project/add.html'
    success_url = _('super-admin')

    @method_decorator([login_required, ])
    @role_required(['superadmin'])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


    def get(self, request):
        if request.user.is_authenticated:
            storage = messages.get_messages(request)
            storage.used = True
            return redirect(_('super-admin'))
        return super().get(self, request)

    def post(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(_('login'))

        if request.POST.get('id'):
            id = request.POST.get('id')
            user = User.objects.get(pk= id)
            form = SuperAdminChangeForm(instance=user, data=request.POST)
            if form.is_valid():
                form.save()
                messages.success(request, 'User data was updated successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return redirect(_('super-admin'))

        try:
            form = SuperAdminCreateForm(request.POST)
            if form.is_valid():
                form.save()
                messages.success(request, 'User was created successfully!')
            else:
                for item in form.errors.items():
                    messages.error(request, item[1], extra_tags=f'danger {item[0]}')
        except Exception as e:
            messages.error(request, f'Something went wrong! {e}')
        return redirect(_('super-admin'))


@login_required()
def delete_builder_view(request, pk=None):
    '''delete_builder_view
    deletes builder and deletes company created when creating the builder.
    '''
    if request.method == 'GET' and request.user.is_superuser:
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            messages.success(request, 'Builder deleted successfully.')
            return redirect(_('super-admin'))
        except Exception as e:
            messages.error(request, 'Something went wrong.', e)
            return redirect(_('super-admin'))


class UserUpdateView(UpdateView):
    model = User
    form_class = UserUpdateForm
    template_name = 'user/user-update.html'
    success_url = _('account-settings')

    def get_object(self, queryset=None):
        return self.request.user

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        profile = Profile.objects.get(user=self.request.user)
        context['profile_form'] = ProfileForm(instance=profile)
        return context

    @method_decorator([login_required,])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()
        if form.is_valid():
            messages.success(request, "Account info saved!")
            return self.form_valid(form)
        else:
            for item in form.errors.items():
                messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return self.form_invalid(form)

class ProfileUpdateView(UpdateView):
    model = Profile
    form_class = ProfileForm
    template_name = 'user/profile-update.html'
    success_url = _('account-settings')

    def get_object(self, queryset=None):
        return self.request.user.profile

    @method_decorator([login_required,])
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()
        if form.is_valid():
            form.save()
            messages.success(request, "Profile info saved!")
            return redirect(_('account-settings'))
        else:
            for item in form.errors.items():
                messages.error(request, item[1], extra_tags=f'danger {item[0]}')
            return self.form_invalid(form)

