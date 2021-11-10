from flask import Flask, jsonify;
from flask_socketio import SocketIO, send
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app,resources={r"/*":{"origins":"*"}, r"/socket.io/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'mysecret'

socketIo = SocketIO(app, cors_allowed_origins='*')

app.debug = True
app.host = 'localhost'


@socketIo.on("message")
def handleMessage(msg):
    print(msg)
    send(msg, broadcast=True)
    return None

if __name__ == '__main__':
    socketIo.run(app,host='0.0.0.0', port=5000)