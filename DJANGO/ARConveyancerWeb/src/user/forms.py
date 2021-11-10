from django import forms
from django.contrib.auth import password_validation
from django.contrib.auth.forms import PasswordChangeForm, UserChangeForm as DjangoUserChangeForm, PasswordResetForm as DjangoPasswordResetForm, SetPasswordForm
from django.template.loader import render_to_string
from django.forms import PasswordInput, fields
from django.core.exceptions import ValidationError
from django.forms.widgets import EmailInput  
from django.utils.translation import gettext_lazy as _
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.forms import AuthenticationForm, UsernameField
from django.contrib.auth.models import Group
from django.contrib import messages
from django.core.mail import send_mail
from AR import settings
from company.models import Company
from .models import Profile, User, Role

# Define your forms here
class UserCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""

    error_messages = {
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not valid.'),
        'invalid_company': _('company name is not valid.'),
    }
    company = forms.CharField(
        label='Business Name',
        widget=forms.TextInput(attrs={'placeholder': 'Business Name', 'class': 'form-control',})
    )
    password1 = forms.CharField(
        label='Password', 
        widget=forms.PasswordInput(attrs={'placeholder':'Password', 'class': 'form-control',}),
        help_text=password_validation.password_validators_help_text_html(),
    )
    password2 = forms.CharField(
        label='Password confirmation', 
        widget=forms.PasswordInput(attrs={'placeholder':'Confirm Password', 'class': 'form-control',}),
        help_text=_("Enter the same password as before, for verification."),
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'contact', 'role', 'password1', 'password2','is_active')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control','required':'true',}),
            'company': forms.TextInput(attrs={'placeholder':'Business Name', 'class': 'form-control','required':'true',}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact', 'class': 'form-control','required':'true',}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self._meta.model.USERNAME_FIELD in self.fields:
            self.fields[self._meta.model.USERNAME_FIELD].widget.attrs['autofocus'] = True

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError(
                self.error_messages['password_mismatch'],
                code='password_mismatch',
            )
        return password2

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if first_name:
            if not first_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_first_name'],
                    code='invalid_first_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_first_name'],
                code='invalid_first_name',)
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if last_name:
            if not last_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_last_name'],
                    code='invalid_last_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_last_name'],
                code='invalid_last_name',)
        return last_name

    def clean_company(self):
        company = self.cleaned_data.get("company")
        if company:
            if not company.isalnum():
                raise ValidationError(
                    self.error_messages['invalid_company'],
                    code='invalid_company',)
        else:
            raise ValidationError(
                self.error_messages['invalid_company'],
                code='invalid_company',)
        return company

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^[+]?[1-9][0-9]{9,14}$")
        if not pattern.match(contact):
            raise ValidationError(
                self.error_messages['invalid_contact'],
                code='invalid_contact',)

        return contact

    def clean_email(self):
        email = self.cleaned_data.get("email")
        import re
        pattern = re.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$")
        if not pattern.match(email):
            raise ValidationError(
                self.error_messages['invalid_email'],
                code='invalid_email',)
        if email and User.objects.filter(email=email).count():
                raise forms.ValidationError(_("This email address is already in use. Please supply a different email address."))
        return email



    def _post_clean(self):
        company = Company(company_name=self.data['company'])
        super()._post_clean()
        # Validate the password after self.instance is updated with form data
        # by super().
        password = self.cleaned_data.get('password2')
        if password:
            try:
                password_validation.validate_password(password, self.instance)
            except ValidationError as error:
                self.add_error('password2', error)

    def save(self, commit=True):
        user = super().save(commit=False)
        # Save the provided password in hashed format
        user.set_password(self.cleaned_data["password1"])

        # Create company associated to user
        commit = True
        if commit:
            # create a role of the user as a builder
            role = Role.objects.get(role_type="builder")
            user.is_active = True
            user.role = role
            company = Company.objects.create(company_name=self.cleaned_data["company"])
            # company = Company.objects.last()
            user.company = company
            user.save()
        return user


class UserLoginForm(AuthenticationForm):
    '''User Login Form
        Django form used as login form on login page.
        fields:
            username = username of the user
            password = valid password of the user
    '''
    username = UsernameField(
        widget=forms.TextInput(
            attrs={'autofocus': True, 'autocomplete': 'email', 'placeholder':'Email', 'class': 'form-control',}
        )
    )
    password = forms.CharField(
        label=_("Password"),
        strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'current-password', 'placeholder':'Password', 'class': 'form-control',}),
    )


class BuilderAdminCreateForm(UserCreationForm):
    company = None

    error_messages = {
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not valid.'),
    }

    def __init__(self, *args, **kwargs):
        super(BuilderAdminCreateForm, self).__init__(*args, **kwargs)
        self.fields['role'].empty_label = 'Select Role'
        self.fields['company'].empty_label = 'Select Company'

    class Meta:
        model = User
        fields = fields = ('first_name', 'last_name', 'email', 'contact', 'company', 'role', 'password1', 'password2','is_active')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control','required':'true',}),
            'company': forms.Select(attrs={'placeholder':'Select company', 'class': 'custom-select','required':'true',}),
            'role': forms.Select(attrs={'placeholder':'Select role', 'class': 'custom-select','required':'true',}),
            'is_active': forms.CheckboxInput(attrs={'class':'custom-control-input'}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact Number', 'class': 'form-control','required':'true',}),
        }

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if first_name:
            if not first_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_first_name'],
                    code='invalid_first_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_first_name'],
                code='invalid_first_name',)
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if last_name:
            if not last_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_last_name'],
                    code='invalid_last_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_last_name'],
                code='invalid_last_name',)
        return last_name

    def save(self, commit=True):
        print('----------------save')
        user = super().save(commit=commit)
        commit = True
        if commit:
            # create a role of the user as a builder
            user.save()
        return user


class CustomPasswordChangeForm(PasswordChangeForm):
    old_password = forms.CharField(widget=PasswordInput(attrs={'placeholder':'Old Password','class': 'form-control'}))
    new_password1 = forms.CharField(widget=PasswordInput(attrs={'placeholder':'New Password','class': 'form-control'}))
    new_password2 = forms.CharField(widget=PasswordInput(attrs={'placeholder':'Confirm Password','class': 'form-control'}))
    
    class Meta:
        model = User


class BuilderCreateForm(forms.ModelForm):
    """A form for creating new User. Includes all the required
    fields."""

    def __init__(self, *args, **kwargs):
        super(BuilderCreateForm, self).__init__(*args, **kwargs)
        self.fields['role'].empty_label = 'Select Role'
        self.fields['role'].queryset = Role.objects.exclude(role_type__in=['builder', 'superadmin'])
        self.fields['company'].empty_label = 'Select Company'

    error_messages = {
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not a valid.'),
    }

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'contact', 'company', 'role', 'is_active')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control','required':'true',}),
            'company': forms.HiddenInput(),
            'role': forms.Select(attrs={'placeholder':'Select role', 'class': 'custom-select','required':'true',}),
            'is_active': forms.CheckboxInput(attrs={'class':'custom-control-input'}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact Number', 'class': 'form-control','required':'true',}),
        }

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if first_name:
            if not first_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_first_name'],
                    code='invalid_first_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_first_name'],
                code='invalid_first_name',)
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if last_name:
            if not last_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_last_name'],
                    code='invalid_last_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_last_name'],
                code='invalid_last_name',)
        return last_name

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^(\+| )?(0|91)?[0-9]{10}$")
        if not pattern.match(contact):
            raise ValidationError(
                self.error_messages['invalid_contact'],
                code='invalid_contact',)

        return contact

    def clean_email(self):
        email = self.cleaned_data.get("email")
        import re
        pattern = re.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$")
        if not pattern.match(email):
            raise ValidationError(
                self.error_messages['invalid_email'],
                code='invalid_email',)
        if email and User.objects.filter(email=email).count():
                raise forms.ValidationError(_("This email address is already in use. Please supply a different email address."))
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        password = User.objects.make_random_password(length=8)
        user.set_password(password)
        if commit:
            user.save()
            try:
                # Rendering username and password into email.
                message = render_to_string('emails/tradie_invitation.html',{
                        'username': user.email,
                        'password': password
                    })

                # Sending invitation email to the tradie.
                send_mail(
                    subject='Account Invitation',
                    message=message,
                    html_message=message,
                    from_email= settings.EMAIL_HOST_USER,
                    recipient_list=[user.email, ],
                    fail_silently=False,
                )
            except Exception as e:
                print(e)
        return user

class UserChangeForm(DjangoUserChangeForm):

    error_messages = {
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not a valid.'),
    }

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if first_name:
            if not first_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_first_name'],
                    code='invalid_first_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_first_name'],
                code='invalid_first_name',)
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if last_name:
            if not last_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_last_name'],
                    code='invalid_last_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_last_name'],
                code='invalid_last_name',)
        return last_name

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^(\+| )?(0|91)?[0-9]{10}$")
        if not pattern.match(contact):
            raise ValidationError(
                self.error_messages['invalid_contact'],
                code='invalid_contact',)

        return contact

    def clean_email(self):
        email = self.cleaned_data.get("email")
        import re
        pattern = re.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$")
        if not pattern.match(email):
            raise ValidationError(
                self.error_messages['invalid_email'],
                code='invalid_email',)
        return email

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'contact', 'company', 'role', 'is_active')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control','required':'true',}),
            'company': forms.HiddenInput(),
            'role': forms.Select(attrs={'placeholder':'Select role', 'class': 'custom-select','required':'true',}),
            'is_active': forms.CheckboxInput(attrs={'class':'custom-control-input'}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact Number', 'class': 'form-control','required':'true',}),
        }


class PasswordResetForm(DjangoPasswordResetForm):
    '''forget password form'''
    email = forms.EmailField(widget=EmailInput(attrs={'placeholder':'Email','class': 'form-control'}))

    def clean_email(self):
        email = self.cleaned_data['email']
        if not User.objects.filter(email__iexact=email, is_active=True).exists():
            msg = _("There is no user registered with the specified E-Mail address.")
            self.add_error('email', msg)
        return email

class UserSetPasswordForm(SetPasswordForm):
    '''set new password form'''
    new_password1 = forms.CharField(
        label=_("New password"),
        widget=forms.PasswordInput(attrs={'placeholder':'New Password','class': 'form-control'}),
        strip=False,
        help_text=password_validation.password_validators_help_text_html(),
    )
    new_password2 = forms.CharField(
        label=_("New password confirmation"),
        strip=False,
        widget=forms.PasswordInput(attrs={'placeholder':'Confirm Password','class': 'form-control'}),
    )


class SuperAdminCreateForm(forms.ModelForm):
    '''Builder creation form for super-admin view'''
    error_messages = {
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not a valid.'),
    }
    company = forms.CharField(
        label='Business Name',
        widget=forms.TextInput(attrs={'placeholder': 'Business Name', 'class': 'form-control',})
    )
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'contact', 'role','is_active')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control','required':'true',}),
            'company': forms.TextInput(attrs={'placeholder':'Business Name', 'class': 'form-control','required':'true',}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact Number', 'class': 'form-control','required':'true',}),
            'is_active': forms.CheckboxInput(attrs={'class':'custom-control-input'}),
        }

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if first_name:
            if not first_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_first_name'],
                    code='invalid_first_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_first_name'],
                code='invalid_first_name',)
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if last_name:
            if not last_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_last_name'],
                    code='invalid_last_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_last_name'],
                code='invalid_last_name',)
        return last_name

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^[+]?[1-9][0-9]{9,14}$")
        if not pattern.match(contact):
            raise ValidationError(
                self.error_messages['invalid_contact'],
                code='invalid_contact',)

        return contact

    def clean_email(self):
        email = self.cleaned_data.get("email")
        import re
        pattern = re.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$")
        if not pattern.match(email):
            raise ValidationError(
                self.error_messages['invalid_email'],
                code='invalid_email',)
        if email and User.objects.filter(email=email).count():
                raise forms.ValidationError(_("This email address is already in use. Please supply a different email address."))
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        # Save the provided password in hashed format
        password = User.objects.make_random_password(length=8)
        print('---------------password:', password)
        user.set_password(password)

        # Create company associated to user
        company = Company.objects.create(company_name=self.cleaned_data["company"])
        company.save()
        commit = True
        if commit:
            # create a role of the user as a builder
            role = Role.objects.get(role_type="builder")
            user.is_active = True
            user.role = role
            company = Company.objects.get(company_name=self.cleaned_data['company'])
            user.company = company
            user.save()

            try:
                # Rendering username and password into email.
                message = render_to_string('emails/tradie_invitation.html',{
                        'username': user.email,
                        'password': password
                    })

                # Sending invitation email to the tradie.
                send_mail(
                    subject='Account Invitation',
                    message=message,
                    html_message=message,
                    from_email= settings.EMAIL_HOST_USER,
                    recipient_list=[user.email, ],
                    fail_silently=False,
                )
            except Exception as e:
                print(e)
        return user


class SuperAdminChangeForm(UserChangeForm):
    '''Edit form for builder users from superadminlistview.'''
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'contact', 'is_active')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control','required':'true',}),
            'is_active': forms.CheckboxInput(attrs={'class':'custom-control-input'}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact Number', 'class': 'form-control','required':'true',}),
        }



class UserUpdateForm(forms.ModelForm):
    '''Update form for all users from settings menu after logging in .'''
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'contact')
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control', 'required':'true'}),
            'contact': forms.TextInput(attrs={'placeholder':'Contact Number', 'class': 'form-control', 'required':'true'}),
        }

    error_messages = {
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not valid.'),
    }

    def clean_first_name(self):
        first_name = self.cleaned_data.get("first_name")
        if first_name:
            if not first_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_first_name'],
                    code='invalid_first_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_first_name'],
                code='invalid_first_name',)
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get("last_name")
        if last_name:
            if not last_name.isalpha():
                raise ValidationError(
                    self.error_messages['invalid_last_name'],
                    code='invalid_last_name',)
        else:
            raise ValidationError(
                self.error_messages['invalid_last_name'],
                code='invalid_last_name',)
        return last_name

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^[+]?[1-9][0-9]{9,14}$")
        if not pattern.match(contact):
            raise ValidationError(
                self.error_messages['invalid_contact'],
                code='invalid_contact',)

        return contact

    def clean_email(self):
        email = self.cleaned_data.get("email")
        import re
        pattern = re.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$")
        if not pattern.match(email):
            raise ValidationError(
                self.error_messages['invalid_email'],
                code='invalid_email',)
        return email


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        exclude = ('user', 'agent_id',)
        widgets = {
            'user': forms.Select(attrs={'placeholder':'Select User', 'class':'custom-select'},),
            'address': forms.TextInput(attrs={'placeholder':'Address', 'class': 'form-control',}),
            'postal_code': forms.NumberInput(attrs={'placeholder':'Postal Code', 'class': 'form-control',}),
            'city': forms.TextInput(attrs={'placeholder':'City', 'class': 'form-control',}),
            'state': forms.TextInput(attrs={'placeholder':'State', 'class': 'form-control',}),
            'country': forms.TextInput(attrs={'placeholder':'Country', 'class': 'form-control',}),
            'auto_pay': forms.CheckboxInput(attrs={'class':'custom-control-input'}),
        }