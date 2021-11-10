import stripe
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from company.models import Company
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from settings.models import SuperAdminSettings
from django.conf import settings

from django.template.loader import render_to_string
from django.core.mail import send_mail
from AR import settings


# django q imports
from dateutil.relativedelta import relativedelta
from django_q.tasks import schedule
from django_q.models import Schedule

# from payment.mixins import StripeAccount
# User module manager 
class UserManager(BaseUserManager):
    
    # method to create a builder type user
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # method to create a superuser
    def create_superuser(self, email, password, **extra_fields):
        '''Create superuser
            This method creates super user where is_active, is_admin, is_superuser fields are true.
        '''
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_admin') is not True:
            raise ValueError('Superuser must be assigned to is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must be assigned to is_superuser=True')
        if not email:
            raise ValueError('Users must have an email address')

        if not email:
            raise ValueError('Users must have an email address')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        role = Role.objects.get(role_type="superuser")
        user.role = role
        user.set_password(password)
        user.save(using=self._db)
        return user



# Create your models here.
class Role(models.Model):
    role_type = models.CharField(max_length=255,)
    name = models.CharField(max_length=255,null=True, blank=True)

    def __str__(self):
        return self.role_type


class User(AbstractBaseUser, PermissionsMixin):
    MEMBERSHIP_CHOICE = (
        ('free', 'Free'),
        ('active', 'Active'),
        ('expired', 'Expired'),
    )

    first_name = models.CharField(max_length=255,null=True, blank=True)
    last_name = models.CharField(max_length=255,null=True, blank=True)
    email = models.EmailField(max_length=255, unique=True)
    contact = models.CharField(max_length=255,)
    password = models.CharField(max_length=255,)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    last_login = models.DateTimeField(_('last login'), blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True,)
    company = models.ForeignKey(Company, on_delete=models.DO_NOTHING, null=True)
    membership = models.CharField(choices=MEMBERSHIP_CHOICE, max_length=100, default='free', null=True, blank=True)
    last_payment_on = models.DateTimeField(_('Last payment on'), blank=True, null=True)
    objects = UserManager()

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['contact']

    def __str__(self):
        return self.email

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin

    def email_user(self, subject=None, message=None, email_template=None):
        try:
            # Rendering username and password into email.
            message = render_to_string(email_template,{
                    'message':message
                })

            # Sending invitation email to the tradie.
            send_mail(
                subject=subject,
                message=message,
                html_message=message,
                from_email= settings.EMAIL_HOST_USER,
                recipient_list=[self.email, ],
                fail_silently=False,
            )
        except Exception as e:
            print(e)
            return e

    def get_full_name(self):
        return self.first_name + " " + self.last_name



class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    address = models.CharField(verbose_name="Address",max_length=100, null=True, blank=True)
    postal_code = models.CharField(verbose_name="Postal Code",max_length=8, null=True, blank=True)
    city = models.CharField(verbose_name="City",max_length=100, null=True, blank=True)
    state = models.CharField(verbose_name="State",max_length=100, null=True, blank=True)
    country = models.CharField(verbose_name="Country",max_length=100, null=True, blank=True, default="US")
    auto_pay = models.BooleanField(verbose_name="Pay Automatically", default=False)
    
    agent_id = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f'{self.user}'

    def save(self, *args, **kwargs):
        create_stripe = False
        update_stripe = False
        from payment.mixins import StripeAccount
        if self.__dict__['_state'].adding and self.user.role.role_type == 'builder':
            create_stripe = True
        elif not self.__dict__['_state'].adding and self.user.role.role_type == 'builder':
            update_stripe = True
        super(Profile, self).save(*args, **kwargs)
        if create_stripe:
            StripeAccount(self.user).create()
        if update_stripe:
            StripeAccount(self.user).update()


@receiver(post_save, sender=User)
def profile_post_save_receiver(sender, instance, created, *args, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        try:
            setting = SuperAdminSettings.objects.first()
            # if setting.duration_period == 'month':
            #     schedule('user.tasks.end_free_trial',
            #         instance.id,
            #         name=f'{instance.id} {instance.date_joined} user.tasks.end_free_trial',
            #         schedule_type= Schedule.ONCE,
            #         next_run= instance.date_joined + relativedelta(months=setting.duration))
            # elif setting.duration_period == 'day':
            #     schedule('user.tasks.end_free_trial',
            #         instance.id,
            #         name=f'{instance.id} {instance.date_joined} user.tasks.end_free_trial',
            #         schedule_type= Schedule.ONCE,
            #         next_run= instance.date_joined + relativedelta(days=setting.duration))
            # elif setting.duration_period == 'year':
            #     schedule('user.tasks.end_free_trial',
            #         instance.id,
            #         name=f'{instance.id} {instance.date_joined} user.tasks.end_free_trial',
            #         schedule_type= Schedule.ONCE,
            #         next_run= instance.date_joined + relativedelta(years=setting.duration))
            if instance.role.role_type == 'builder':
                schedule('user.tasks.end_free_trial',
                    user_id=instance.id,
                    name=f'{instance.id} {instance.date_joined} user.tasks.end_free_trial',
                    schedule_type= Schedule.ONCE,
                    next_run= instance.date_joined + relativedelta(minutes=setting.duration))

        except Exception as e:
            print(e)
    else:
        pass

@receiver(pre_delete, sender=User)
def user_pre_delete_receiver(sender, instance, *args, **kwargs):
    if instance.role.role_type == 'builder':
        for task in settings.DJANGO_Q_TASKS:
            t_name = f'{instance.id} {instance.date_joined} {task}'
            Schedule.objects.filter(name=t_name).delete()
        User.objects.filter(company=instance.company).exclude(role=Role.objects.get(role_type='builder')).delete()
        instance.company.delete()
        if instance.profile.agent_id:
            stripe.api_key = settings.STRIPE_PRIVATE_KEY
            try:
                stripe.Customer.delete(instance.profile.agent_id)
            except Exception as e:
                print('Stripe Customer Deleting error: ', e)