from django import forms
from django.core.exceptions import ValidationError  
from .models import Stage
from layer.models import Layer

class StageCreateForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        super(StageCreateForm, self).__init__(*args, **kwargs)
        self.fields['tradie'].empty_label = 'Select Tradie'
        self.fields['layer'].empty_label = 'Select Layer'

    
    class Meta:
        model = Stage
        fields = ['name', 'status', 'project', 'tradie', 'layer']
        widgets = {
            'name':forms.TextInput(attrs={'placeholder':'Enter Name','class':'form-control stage_name','required':'true',}),
            'status': forms.CheckboxInput(attrs={'class':'custom-control-input',}),
            'project': forms.HiddenInput(attrs={'id':'id_stage_project',}),
            'tradie': forms.Select(attrs={'class':'custom-select'},),
            'layer': forms.Select(attrs={'class':'custom-select'},),
        }