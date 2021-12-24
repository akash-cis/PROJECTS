import traceback
from api.models import Appointment
from api.sms import receive_sms

def receive_message():
    try:
        from_number = '+917016881445'                   # Lead phone number which one send from 
        # to_number = '+11123456789'
        to_number = '+917016881445'                     # User (Sales Person) phone number which one create appointment
        message_body = 'Hello'      # Dummy not important to pass correct one
        message_sid = 'SM8e6381f7e7a9413d8a283cfe1e49ec4b'
        
        receive_sms(from_number, to_number, message_body, message_sid)
    except Exception as e:
        traceback.print_exc()

# from api.utils import encrypt_decrypt

# appointment_id = '20|20-11-2021 18:05'
# encrypted_appointment_id = encrypt_decrypt.Crypt().encrypt_message(str(appointment_id))

# print(encrypted_appointment_id)

# receive_message()