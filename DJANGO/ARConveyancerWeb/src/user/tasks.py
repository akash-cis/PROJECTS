from math import ceil
import stripe
from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.utils import timezone

stripe_key = settings.STRIPE_PUBLIC_KEY
stripe.api_key = settings.STRIPE_PRIVATE_KEY

# django q imports
from django_q.tasks import schedule
from django_q.models import Schedule

from layer.models import Layer
from project.models import Project
from payment.models import Invoice
from settings.models import SuperAdminSettings
from payment.utils import cent_to_dollar, dollar_to_cent
from payment.mixins import StripeAccount, StripeData, StripePayment
from .models import User

def end_free_trial(user_id):
    user = User.objects.get(pk=user_id)
    print(f'{user} : Free Trial Expired.')
    if user.membership == 'free':
        user.membership = 'active'
        user.save()
        email_template = 'emails/user_trial_expired.html'
        subject = 'Your trial period has been expired!'
        message = 'Your Trial Period has been expired. If you wish to continue using our services you will have to pay for the services you use from the next month.'
        e = user.email_user(subject, message, email_template)
        print(e)

        setting = SuperAdminSettings.objects.first() 
        if setting.duration_period == 'month':
            user.last_payment_on = user.date_joined + relativedelta(months=setting.duration)
        elif setting.duration_period == 'day':
            user.last_payment_on = user.date_joined + relativedelta(days=setting.duration)
        elif setting.duration_period == 'year':
            user.last_payment_on = user.date_joined + relativedelta(years=setting.duration)

        schedule('user.tasks.payment',
            user_id=user.id,
            name=f'{user.id} {user.date_joined} user.tasks.payment',
            # schedule_type= Schedule.MONTHLY,
            # next_run= user.last_payment_on + relativedelta(months=setting.duration),
            schedule_type=Schedule.CRON,
            cron = '*/3 * * * *')


def payment(user_id):
    # This task will generate invoice of the month and send invoice email to the user. 
    user = User.objects.get(pk=user_id)
    setting = SuperAdminSettings.objects.first() 
    
    print(f'{user} : Payment.')
    agent_id = user.profile.agent_id

    projects = Project.objects.filter(user = user, status=True)

    if setting.duration_period == 'month':
        user.last_payment_on = user.date_joined + relativedelta(months=setting.duration)
    elif setting.duration_period == 'day':
        user.last_payment_on = user.date_joined + relativedelta(days=setting.duration)
    elif setting.duration_period == 'year':
        user.last_payment_on = user.date_joined + relativedelta(years=setting.duration)

    if projects.exists():
        layers = []
        for project in projects:
            invoice_item = stripe.InvoiceItem.create(
                customer= agent_id,
                amount= dollar_to_cent(SuperAdminSettings.objects.first().project_rate),
                currency='USD',
                description= f'Project: {project.name}'
            )
            layers = Layer.objects.filter(project=project)
            for layer in layers:
                invoice_item = stripe.InvoiceItem.create(
                    customer= agent_id,
                    amount= dollar_to_cent(SuperAdminSettings.objects.first().layer_rate),
                    currency='USD',
                    description= f'Project: {layer.project} Layer: {layer}'
                )
        customer = stripe.Customer.retrieve(agent_id)

        # if user.profile.auto_pay and customer['default_source']:
        if True:

            payment = StripePayment(
                user=user,
                agent_id=agent_id,
                currency= 'USD'
            ).pay_invoice()

            print(payment['message'])
            print(payment['tran_id'])
            if payment['message'] == 'Perfect':
                print('payment is perfect lets generate the invoice:')
                print(payment['invoice'])
                invoice = Invoice(
                    user=user,
                    company=user.company,
                    tran_id=payment['tran_id'],
                    amount=float(cent_to_dollar(payment['invoice']['total'])),
                    status = payment['invoice']['status'],
                    paid = payment['invoice']['paid'],
                    invoice_pdf = payment['invoice']['invoice_pdf'],
                    hosted_invoice_url = payment['invoice']['hosted_invoice_url'],
                )
                invoice.save()
        
        else:
            payment = StripePayment(
                user=user,
                agent_id=agent_id,
            ).send_invoice()

            if payment['message'] == "Perfect":
                invoice = payment['invoice_sent']

                due_date = datetime.fromtimestamp(int(invoice["due_date"])).strftime('%d-%m-%Y')
                remaining_days = relativedelta(due_date, user.last_payment_on).days
                next_run_day = ceil(remaining_days / 2)

                schedule('user.tasks.due_date_notify',
                    user_id=user.id,
                    invoice_id=invoice['id'],
                    day_left=remaining_days,
                    name=f'{user.id} {user.last_payment_on} user.tasks.due_date_notify',
                    schedule_type= Schedule.ONCE,
                    next_run= user.last_payment_on + relativedelta(days=next_run_day))


def due_date_notify(user_id, invoice_id, day_left):
    user = User.objects.get(pk=user_id)
    invoice = stripe.Invoice.retrieve(invoice_id)
    due_date = datetime.fromtimestamp(int(invoice["due_date"])).strftime('%d-%m-%Y')

    if timezone.now() > due_date:
        user.membership = 'expired'
        user.save()
    else:
        if not invoice['paid']:
            remaining_days = relativedelta(due_date, timezone.now()).days
            next_run_day = ceil(remaining_days / 2)

            email_template = 'emails/user_trial_expired.html'
            subject = f"Due date is near. Only {remaining_days} day's left."
            message = f"{user} Your Invoice's due date is near. If you wish to continue using our services kindly pay the invoice before the {due_date}."
            user.email_user(subject, message, email_template)

            schedule('user.tasks.due_date_notify',
                user_id=user.id,
                invoice_id=invoice['id'],
                day_left=remaining_days,
                name=f'{user.id} {user.last_payment_on} user.tasks.due_date_notify',
                schedule_type= Schedule.ONCE,
                next_run= timezone.now() + relativedelta(days=next_run_day))






# def pay(self):
    # from payment.mixins import StripePayment, StripeData
    # users = User.objects.filter(is_active=True, is_superadmin=False)

    # for user in users:
    #     from settings.models import SuperAdminSettings
    #     setting = SuperAdminSettings.objects.first()

    #     # if the user is free and it's out of the trial period
    #     if user.membership == 'free':
    #         if (setting.trial_duration_period == 'day' and relativedelta(datetime.now(), user.date_joined).days >= setting.trial_duration):
    #             user.membership = 'active'
    #             user.last_payment_on = user.date_joined + relativedelta(days=setting.trial_duration)

    #         elif (setting.trial_duration_period == 'month' and relativedelta(datetime.now(), user.date_joined).months >= setting.trial_duration):
    #             user.membership = 'active'
    #             user.last_payment_on = user.date_joined + relativedelta(months=setting.trial_duration)

    #         elif (setting.trial_duration_period == 'year' and relativedelta(datetime.now(), user.date_joined).years >= setting.trial_duration):
    #             user.membership = 'active'
    #             user.last_payment_on = user.date_joined + relativedelta(years=setting.trial_duration)

    #     if user.membership == 'active':
    #         if relativedelta(datetime.now(), user.last_payment_on).months >= 1:
                
    #             agent_id = user.profile.agent_id

    #             projects = Project.objects.filter(user = user, status=True)
    #             layers = []
    #             for project in projects:
    #                 ls = Layer.objects.filter(project=project)
    #                 for l in ls:
    #                     layers.append(l)

    #             for project in projects:
    #                 invoice_item = stripe.InvoiceItem.create(
    #                     customer= agent_id,
    #                     amount= dollar_to_cent(SuperAdminSettings.objects.first().project_rate),
    #                     currency='USD',
    #                     description= f'Project: {project.name}'
    #                 )
                
    #             for layer in layers:
    #                 invoice_item = stripe.InvoiceItem.create(
    #                     customer= agent_id,
    #                     amount= dollar_to_cent(SuperAdminSettings.objects.first().layer_rate),
    #                     currency='USD',
    #                     description= f'Project: {layer.project} Layer: {layer}'
    #                 )

    #             customer = stripe.Customer.retrieve(agent_id)
    #             if user.profile.auto_pay and customer['default_source']:

    #                 payment = StripePayment(
    #                     user=user,
    #                     agent_id=agent_id,
    #                     currency= 'USD'
    #                 ).pay_invoice()

    #                 print(payment['message'])
    #                 print(payment['tran_id'])
    #                 if payment['message'] == 'Perfect':
    #                     print('payment is perfect lets generate the invoice:')
    #                     print(payment['invoice'])
    #                     invoice = Invoice(
    #                         user=user,
    #                         company=user.company,
    #                         tran_id=payment['tran_id'],
    #                         amount=float(cent_to_dollar(payment['invoice']['total'])),
    #                         status = payment['invoice']['status'],
    #                         paid = payment['invoice']['paid'],
    #                         invoice_pdf = payment['invoice']['invoice_pdf'],
    #                         hosted_invoice_url = payment['invoice']['hosted_invoice_url'],
    #                     )
    #                     invoice.save()
                
    #             else:
    #                 payment = StripePayment(
    #                     user=user,
    #                     agent_id=agent_id,
    #                 ).send_invoice()
    #                 print(payment['message'])
            
    #     if user.membership == 'expired':
    #         pass
