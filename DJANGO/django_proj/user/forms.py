from django import forms
from django.core.exceptions import ValidationError
from django.forms import widgets
from .models import Parent, Profile, Student
from django.contrib.auth import password_validation
from django.utils.translation import gettext_lazy as _


class ParentForm(forms.ModelForm):
    error_messages = {
        'password_mismatch': _('The two password fields didn’t match.'),
        'invalid_first_name': _('First Name should only conatin Alphabets.'),
        'invalid_last_name': _('Last Name should only conatin Alphabets.'),
        'invalid_email': _('Email is not valid.'),
        'invalid_contact': _('Contact Number is not valid.'),
    }
    password1 = forms.CharField(
        label='Password', 
        widget=forms.PasswordInput(attrs={'placeholder':'Password', 'class': 'form-control form-control-lg',}),
        # help_text=password_validation.password_validators_help_text_html(),
    )
    password2 = forms.CharField(
        label='Password confirmation', 
        widget=forms.PasswordInput(attrs={'placeholder':'Confirm Password', 'class': 'form-control form-control-lg',}),
        # help_text=_("Enter the same password as before, for verification."),
    )
    class Meta:
        model = Parent
        fields = ['first_name', 'last_name', 'email', 'contact', 'password1', 'password2']
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control form-control-lg','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control form-control-lg','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':'Email', 'class': 'form-control form-control-lg','required':'true',}),
            'contact': forms.NumberInput(attrs={'placeholder':'Contact', 'class': 'form-control form-control-lg','required':'true',}),
        }

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError(
                self.error_messages['password_mismatch'],
                code='password_mismatch',
            )
        return password2
    
    def _post_clean(self):
        super()._post_clean()

        password = self.cleaned_data.get('password2')
        if password:
            try:
                password_validation.validate_password(password, self.instance)
            except ValidationError as error:
                self.add_error('password2', error)

    def save(self, commit=True):
        parent = super().save(commit=False)

        parent.set_password(self.cleaned_data['password1'])
        commit=True
        if commit:
            parent.save()
        return parent
        
class StudentForm(forms.ModelForm):
    class Meta:
        model= Student
        fields = ['first_name', 'last_name', 'date_of_birth']
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder':'First Name', 'class': 'form-control form-control-lg','required':'true',}),
            'last_name': forms.TextInput(attrs={'placeholder':'Last Name', 'class': 'form-control form-control-lg','required':'true',}),
            'date_of_birth': forms.DateInput(attrs={'placeholder':'Date Of Birth', 'type':'date', 'class': 'form-control form-control-lg','required':'true',}),
        }


class PaymentForm(forms.Form):
    token = forms.CharField(max_length=200, widget=forms.HiddenInput)


from django.contrib.auth.forms import AuthenticationForm, UsernameField

class LoginForm(AuthenticationForm):
    '''User Login Form
        Django form used as login form on login page.
        fields:
            username = username of the user
            password = valid password of the user
    '''
    username = UsernameField(
        widget=forms.TextInput(
            attrs={'autofocus': True, 'autocomplete': 'email', 'placeholder':'Email', 'class': 'form-control form-control-lg',}
        )
    )
    password = forms.CharField(
        label=_("Password"),
        strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'current-password', 'placeholder':'Password', 'class': 'form-control form-control-lg',}),
    )
