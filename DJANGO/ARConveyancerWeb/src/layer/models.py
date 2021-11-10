import os
from django.db import models
from project.models import Project
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver
from datetime import datetime
from django.utils import timezone


def layer_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return f'layers/{instance.project}/{filename}'


def validate_file_extension(value):
    import os
    from django.core.exceptions import ValidationError
    ext = os.path.splitext(value.name)[1]  # [0] returns path+filename
    valid_extensions = ['.dwg','.png']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported file extension.')

def validate_png_file_extension(value):
    import os
    from django.core.exceptions import ValidationError
    ext = os.path.splitext(value.name)[1]  # [0] returns path+filename
    valid_extensions = ['.png']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported file extension.')


# Create your models here.
class Layer(models.Model):
    image = models.FileField(upload_to=layer_directory_path, validators=(validate_file_extension,), null=True, blank=True)
    png_image = models.FileField(upload_to=layer_directory_path, validators=(validate_png_file_extension,))
    name = models.CharField(max_length=255, null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True, null=True, blank=True)


    def __str__(self):
        # return os.path.basename(os.path.splitext(self.image.name)[0])
        return self.name if self.name else 'layer'


@receiver(pre_delete, sender=Layer)
def mymodel_delete(sender, instance, **kwargs):
    # Pass false so FileField doesn't save the model.
    if instance.image:
        instance.image.delete(False)
    if instance.png_image:
        instance.png_image.delete(False)