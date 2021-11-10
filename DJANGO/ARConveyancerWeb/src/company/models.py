from django.db import models

# Create your models here.
class Company(models.Model):
    company_name = models.CharField(max_length=50,)
    # user = models.OneToOneField(User, verbose_name='User', on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return self.company_name

    class Meta:
        verbose_name_plural = "Companies"