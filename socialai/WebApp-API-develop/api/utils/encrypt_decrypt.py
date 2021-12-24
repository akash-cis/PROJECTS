from cryptography.fernet import Fernet
from config import ENCRYPT_DECRYPT_KEY

class Crypt:

    def __init__(self):
        if ENCRYPT_DECRYPT_KEY:
            self.key = ENCRYPT_DECRYPT_KEY
        else:
            self.key = "ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv2oasOM1Pg="

        self.key = self.key.encode('utf-8')

    def encrypt_message(self, message: bytes):
        """
        Encrypts a message
        """
        encoded_message = message.encode()
        f = Fernet(self.key)
        encrypted_message = f.encrypt(encoded_message)

        return encrypted_message.decode()

    def decrypt_message(self, encrypted_message: bytes):
        """
        Decrypts an encrypted message
        """
        encrypted_message = encrypted_message.encode('utf-8')
        f = Fernet(self.key)
        decrypted_message = f.decrypt(encrypted_message)

        return decrypted_message.decode()
