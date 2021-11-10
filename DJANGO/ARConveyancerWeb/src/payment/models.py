from company.models import Company
from django.db import models
from user.models import User
# Create your models here.
# class PaymentHistory(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
#     payment_for = models.ForeignKey(Membership, on_delete=models.SET_NULL, null=True)
#     date = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.user.username

class Invoice(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    tran_id = models.CharField(max_length=100)
    amount = models.IntegerField()
    status = models.CharField(max_length=100, null=True, blank=True)
    paid = models.BooleanField(null=True, blank=True)
    invoice_pdf = models.URLField(null=True, blank=True)
    hosted_invoice_url = models.URLField(null=True, blank=True)
    
    def __str__(self):
        return f'{self.user}'