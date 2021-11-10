from django.db import models

# Create your models here.
class History(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=150)
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=100, null=True, blank=True)
    paid = models.BooleanField(default=False, null=True, blank=True)

    def __str__(self):
        return f'{self.transaction_id}'
 