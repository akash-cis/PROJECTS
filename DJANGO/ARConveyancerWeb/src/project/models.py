from django.db import models
from io import BytesIO
import qrcode
import json
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver
from django.core.files import File
from PIL import Image, ImageDraw
from user.models import User
from company.models import Company
from django.conf import settings
from .utils import encrypt
from django.utils import timezone

# Create your models here.
class Project(models.Model):
    HP_LIST = (
        ('right', 'Right'),
        ('left', 'Left'),
    )
    VP_LIST = (
        ('top', 'Top'),
        ('bottom', 'Bottom'),
    )

    name = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    address = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    contact = models.CharField(max_length=13)
    status = models.BooleanField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    qr_code = models.ImageField(upload_to='qr_codes', blank=True)
    horizontal_distance = models.PositiveIntegerField(default=0)
    vertical_distance = models.PositiveIntegerField(default=0)
    horizontal_position = models.CharField(choices=HP_LIST, max_length=255)
    vertical_position = models.CharField(choices=VP_LIST, max_length=255)


    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.__dict__['_state'].adding:
            super(Project, self).save(*args, **kwargs)
            qrcode_image = qrcode.QRCode(
                            version=3,
                            error_correction=qrcode.constants.ERROR_CORRECT_L,
                            box_size=10,
                            border=3,
                        )
            qrcode_meta_data = self.__dict__.copy()

            qrcode_meta_data = encrypt(qrcode_meta_data.pop('id'))
            print(qrcode_meta_data)

            qrcode_image.add_data(str(json.dumps(qrcode_meta_data)))
            from datetime import datetime
            fname = f'{self.id}_{self.user.id}_{self.company.id}_{datetime.now()}.png'
            
            qrcode_image.make()
            img = qrcode_image.make_image(fill_color="black", back_color="white")
            img_w, img_h = img.size

            canvas = Image.new('RGB', (img_h,img_w), 'white')
            ImageDraw.Draw(canvas)
            bg_w, bg_h = canvas.size
            offset = ((bg_w - img_w) // 2, (bg_h - img_h) // 2)
            canvas.paste(img, offset)
            buffer = BytesIO()
            canvas.save(buffer, 'PNG')
            self.qr_code.save(fname, File(buffer), save=False)
            canvas.close()
            
        super(Project, self).save(*args, **kwargs)

@receiver(pre_delete, sender=Project)
def mymodel_delete(sender, instance, **kwargs):
    # Pass false so FileField doesn't save the model.
    instance.qr_code.delete(False)