from django.db import models
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password, check_password
from company.models import Company

# Create your models here.
class Tradie(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    contact = models.CharField(max_length=15)
    status = models.BooleanField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    password = models.CharField(max_length=255)

    _password = None

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['email', 'company'], name='unique_tradie')
        ]

    def __str__(self):
        return self.name

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self._password = raw_password

    def make_random_password(self, length=10,
                             allowed_chars='abcdefghjkmnpqrstuvwxyz'
                                           'ABCDEFGHJKLMNPQRSTUVWXYZ'
                                           '23456789'):
        """
        Generate a random password with the given length and given
        allowed_chars. The default value of allowed_chars does not have "I" or
        "O" or letters and digits that look similar -- just to avoid confusion.
        """
        return get_random_string(length, allowed_chars)

    def check_password(self, raw_password):
        """
        Return a boolean of whether the raw_password was correct. Handles
        hashing formats behind the scenes.
        """
        def setter(raw_password):
            self.set_password(raw_password)
            # Password hash upgrades shouldn't be considered password changes.
            self._password = None
            self.save(update_fields=["password"])
        return check_password(raw_password, self.password, setter)