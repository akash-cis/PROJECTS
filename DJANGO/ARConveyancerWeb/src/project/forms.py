from django import forms
from django.core.exceptions import ValidationError  
from .models import Project


# create your forms here
class ProjectCreateForm(forms.ModelForm):
    """A form for creating new project. Includes all the required
    fields."""

    def __init__(self, *args, **kwargs):
        super(ProjectCreateForm, self).__init__(*args, **kwargs)
        self.fields['horizontal_position'].empty_label = 'Position'
        self.fields['vertical_position'].empty_label = 'Position'


    class Meta:
        model = Project
        fields = ['name','address','email','contact','status','user','company','horizontal_distance','vertical_distance','horizontal_position','vertical_position']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder':' Name', 'class':'form-control','required':'true',}),
            'address': forms.Textarea(attrs={'placeholder':' Address', 'class':'form-control','required':'true',}),
            'email': forms.EmailInput(attrs={'placeholder':' Email', 'class':'form-control','required':'true',}),
            'contact': forms.TextInput(attrs={'placeholder':' Contact', 'class':'form-control','required':'true',}),
            'status': forms.CheckboxInput(attrs={'class':'custom-control-input',}),
            'user': forms.Select(attrs={'placeholder':'Select User', 'class':'custom-select'},),
            'company': forms.Select(attrs={'placeholder':'Select Business', 'class':'custom-select'},),
            'horizontal_distance': forms.NumberInput(attrs={'placeholder':'Horizontal Distance', 'class':'form-control','required':'true',}),
            'vertical_distance': forms.NumberInput(attrs={'placeholder':'Vertical Distance', 'class':'form-control','required':'true',}),
            'horizontal_position': forms.Select(attrs={'class':'custom-select'}),
            'vertical_position': forms.Select(attrs={'class':'custom-select'}),
        }

    def clean_name(self):
        name = self.cleaned_data.get("name")

        import re
        pattern = re.compile("^[a-zA-Z0-9 ]{1,50}$")
        if not pattern.match(name):
            raise ValidationError(
                'Project name should only contain alphabets, numbers and spaces.',
                code='invalid_name',)

        return name

    def clean_contact(self):
        contact = self.cleaned_data.get("contact")
        import re
        pattern = re.compile("^[+]?[1-9][0-9]{9,14}$")
        if not pattern.match(contact):
            raise ValidationError(
                'The Contact Number is not a valid Contact Number.',
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
        # if email and Tradie.objects.filter(email=email, company=self.request.user.company).count():
        #         raise forms.ValidationError(_("This email address is already in use. Please supply a different email address for tradie."))
        return email

