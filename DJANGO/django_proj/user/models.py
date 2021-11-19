from django.db import models
# from django.contrib.auth.models import User as DjangoUser
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_delete
from payment.utils import StripeAccount
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
# Create your models here.


class ParentManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('User must have an email address.')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_active",True)
        extra_fields.setdefault("is_admin",True)
        extra_fields.setdefault("is_superuser",True)

        if not email:
            raise ValueError('Superuser must have an email address.')
        if not extra_fields.get('is_admin'):
            raise ValueError('Superuser must be assigned to is_admin=True')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must be assigned to is_superuser=True')

        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user



class Parent(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(max_length=255,null=True, blank=True)
    last_name = models.CharField(max_length=255,null=True, blank=True)
    email = models.EmailField(max_length=255, unique=True)
    contact = models.CharField(max_length=255,)
    password = models.CharField(max_length=255,)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    stripe_id = models.CharField(max_length=100, null=True, blank=True)
    subscription_status = models.CharField(max_length=20, null=True, blank=True)
    subscription_id = models.CharField(max_length=100, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['contact']

    objects = ParentManager()


    def __str__(self):
        return self.email

    @property
    def is_staff(self):
        return self.is_admin

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'

    def send_email(self, subject, message, email_template=None):
        try:
            message = render_to_string(email_template,{
                'message': message
            })
            mail = send_mail(
                subject=subject,
                message=message,
                html_message=message,
                from_email = settings.EMAIL_HOST_USER,
                recipient_list= [self.email,],
                fail_silently=False,
            )
            return mail
        except Exception as e:
            print(e)
            return e
        

class Membership(models.Model):
    MEMBERSHIP_CHOICES = (
        ('Free', 'free'),
        ('Premium', 'premium'),
    )
    slug = models.CharField(max_length=20)
    type = models.CharField(max_length=20, choices=MEMBERSHIP_CHOICES)
    price = models.PositiveIntegerField()
    stripe_plan_id = models.CharField(max_length=50)

    def __str__(self):
        return self.type


class UserMembership(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE)
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE)

    def __str__(self):
        return self.parent.email

class Subscription(models.Model):
    user_membership = models.ForeignKey(UserMembership, on_delete=models.CASCADE)
    # parent = models.ForeignKey(Parent, on_delete=models.CASCADE)
    stripe_sub_id = models.CharField(max_length=30, null=True, blank=True)
    active = models.BooleanField()
    start_date = models.DateTimeField()

    def __str__(self):
        return self.user_membership.parent.email



class Profile(models.Model):
    parent = models.OneToOneField(Parent, on_delete=models.CASCADE)
    city = models.CharField(max_length=20)
    state = models.CharField(max_length=20)
    country = models.CharField(max_length=20)
    line1 = models.TextField()
    postal_code = models.CharField(max_length=6)

    def __str__(self):
        return self.parent.email

    def save(self, *args, **kwargs):
        create_stripe = False
        update_stripe = False

        if self.__dict__['_state'].adding:
            create_stripe = True
        elif not self.__dict__['_state'].adding:
            update_stripe = True
        
        super(Profile, self).save(*args, **kwargs)
        if create_stripe:
            StripeAccount(self.parent).create()
        if update_stripe:
            StripeAccount(self.parent).update()



class Student(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, null=True, blank=True)
    first_name = models.CharField(max_length=20)
    last_name = models.CharField(max_length=20)
    date_of_birth = models.DateField()

    def __str__(self):
        return f'{self.first_name} {self.last_name}'



@receiver(post_save, sender=Parent)
def parent_post_save_receiver(sender, instance, created, *args, **kwargs):
    if created:
        Profile.objects.create(parent=instance)


@receiver(pre_delete, sender=Parent)
def parent_pre_delete_receiver(sender, instance, *args, **kwargs):
    try:
        StripeAccount(instance).delete()
    except Exception as e:
        print(e)