from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.db.models.signals import pre_save
from django.dispatch.dispatcher import receiver

# Create your models here.
class SuperAdminSettings(models.Model):
    PERIOD_DURATION = (
        ('day', 'Day'),
        ('month', 'Month'),
        ('year', 'Year'),
    )
    logo = models.ImageField(upload_to="site/logo/")
    qr_code_text = models.TextField()
    project_rate = models.PositiveIntegerField(verbose_name="Project Rate", default=0, null=True, blank=True)
    layer_rate = models.PositiveIntegerField(verbose_name="Layer Rate", default=0, null=True, blank=True)
    duration = models.IntegerField(default=1)
    duration_period = models.CharField(choices=PERIOD_DURATION, max_length=100, default='month')
    trial_duration = models.IntegerField(default=1)
    trial_duration_period = models.CharField(choices=PERIOD_DURATION, max_length=100, default='month')
    due_days = models.IntegerField(verbose_name=_('Due Days'), default=30)

    class Meta:
        verbose_name_plural = "Super Admin Settings"

    def __str__(self):
        return "Super Admin Settings"

@receiver(pre_save, sender=SuperAdminSettings)
def sas_pre_save(sender, instance, **kwargs):
    # Pass false so FileField doesn't save the model.
    try:
        old_img = instance.__class__.objects.get(id=instance.id).logo.path
        try:
            new_img = instance.logo.path
        except:
            new_img = None
        if new_img != old_img:
            import os
            if os.path.exists(old_img):
                os.remove(old_img)
    except:
        pass