import traceback
from api import socketio

class SocketIOTrigger:
    '''
        Trigger class for anything update in backend then just notify the front-side to reload view
    '''

    def __init__(self) -> None:
        pass

    def trigger(self, event_name : str, data : dict):
        try:
            socketio.emit(event_name, data)
        except Exception as e:
            traceback.print_exc()
