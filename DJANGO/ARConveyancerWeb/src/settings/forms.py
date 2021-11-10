from django import forms
from django.forms import fields
from .models import SuperAdminSettings

class SuperAdminSettingsForm(forms.ModelForm):
    class Meta:
        model = SuperAdminSettings
        fields = '__all__'

        widgets = {
            'logo': forms.FileInput(attrs={'class':'upload',}),
            'qr_code_text': forms.Textarea(attrs={'placeholder':' Enter Text to print with QR Code.', 'class':'form-control message_area',}),
            'project_rate': forms.TextInput(attrs={'placeholder':'Rate/Project','class':'form-control','type':'number'}),
            'layer_rate': forms.TextInput(attrs={'placeholder':'Rate/Layer','class':'form-control','type':'number'}),
            'duration_period': forms.Select(attrs={'class':'custom-select'},),
            'duration': forms.NumberInput(attrs={'placeholder':'Duration','class':'form-control'}),
            'trial_duration_period': forms.Select(attrs={'class':'custom-select'},),
            'trial_duration': forms.NumberInput(attrs={'placeholder':'Trial Duration','class':'form-control'}),
            'due_days': forms.NumberInput(attrs={'placeholder':'Due Days','class':'form-control'}),
        }