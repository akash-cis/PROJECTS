from django.contrib.auth.tokens import PasswordResetTokenGenerator
import six

class TokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, tradie, timestamp):
        return (
            six.text_type(tradie.pk) + six.text_type(timestamp) +
            six.text_type(tradie.status)
        )

account_activation_token = TokenGenerator()