from django.db import models
from twilio.rest import Client
from django.conf import settings

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

# Create your models here.

class Score(models.Model):
    score = models.IntegerField()

    def __str__(self):
        return str(self.id)


    def save(self, *args, **kwargs):
        if self.score < 50:
            message = client.messages.create(
                body = f"Hey this is a test message bro! {self.score}",
                from_ = settings.TWILIO_PHONE_NUMBER,
                to = "+918758254358"
            )
            print(message)
        super().save(*args, **kwargs)