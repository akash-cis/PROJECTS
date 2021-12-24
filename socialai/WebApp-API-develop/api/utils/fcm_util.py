import traceback
from pyfcm import FCMNotification
from config import FCM_SERVER_KEY

class FCMInit:
    '''
        Trigger class for anything update in backend then just notify the front-side to reload view
    '''

    def __init__(self) -> None:
        self.push_service = FCMNotification(api_key=FCM_SERVER_KEY)

    def send(self, registration_ids : list, message_title : str, message_body : str):
        try:
            self.push_service.notify_multiple_devices(
                registration_ids=registration_ids, 
                message_title=message_title, 
                message_body=message_body)
        except Exception as e:
            traceback.print_exc()
