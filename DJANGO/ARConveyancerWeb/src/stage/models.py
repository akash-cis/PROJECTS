from django.db import models
from project.models import Project
from tradies.models import Tradie
from django.utils import timezone
from layer.models import Layer
from django.db.models import Q

# Create your models here.
class Stage(models.Model):


    name = models.CharField(max_length=255)
    plan_date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    status = models.BooleanField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    tradie = models.ForeignKey(Tradie, on_delete=models.SET_NULL, null=True, blank=True)
    layer = models.ForeignKey(Layer, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

    @property
    def project_name(self):
        return self.project