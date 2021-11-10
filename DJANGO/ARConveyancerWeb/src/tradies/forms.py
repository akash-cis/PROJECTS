from django import forms
from django.core.exceptions import ValidationError  
from django.urls import reverse_lazy as _
from .models import Tradie


class TradieCreateForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""
    error_messages = {
        'invalid_name': _('Name should only conatin Alphabets.'),
        'invalid_email': _('Email is not a valid email address.'),
        'invalid_contact': _('Contact Number is not a valid Contact Number.'),
    }

    class Meta:
        model = Tradie
        fields = ['name','email','contact','status','company']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder':' Name', 'class':'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':' Email', 'class':'form-control','required':'true',}),
            'contact': forms.TextInput(attrs={'placeholder':' Contact Number', 'class':'form-control','required':'true',}),
            'status': forms.CheckboxInput(attrs={'class':'custom-control-input',}),
            # 'company': forms.Select(attrs={'placeholder':' Business Name', 'class':'custom-select','required':'true',},),
            'company': forms.HiddenInput()
        }

    def clean_name(self):
        name = self.cleaned_data.get("name")
        import re
        pattern = re.compile("^[a-zA-Z ]{1,50}$")
        if not pattern.match(name):
            raise ValidationError(
                'name should only contain alphabets and spaces.',
                code='invalid_name',)

        return name

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^[+]?[1-9][0-9]{9,14}$")
        if not pattern.match(contact):
            raise ValidationError(
                'Contact Number is not a valid Contact Number.',
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

        #       ----    uncomemnt this code if you want the tradie email to be unique   ----
        # if email and Tradie.objects.filter(email=email, company=self.request.user.company).count():
        #         raise forms.ValidationError(_("This email address is already in use. Please supply a different email address for tradie."))
        return email
