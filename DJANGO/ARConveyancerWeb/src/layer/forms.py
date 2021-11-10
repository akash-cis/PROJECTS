from django import forms
from .models import Layer


class LayerCreateForm(forms.ModelForm):
    class Meta:
        model = Layer
        fields = ['png_image', 'project', 'name']
        widgets = {
            'name':forms.TextInput(attrs={'placeholder':'Enter Name','class':'field','required':'true',}),
            'png_image': forms.FileInput(attrs={'class':'upload'}),
            'project': forms.HiddenInput()
        }

