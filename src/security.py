from cryptography.fernet import Fernet
import os
import logging

logger = logging.getLogger(__name__)

class SecurityManager:
    def __init__(self, key=None):
        if key is None:
            key = Fernet.generate_key()
        self.fernet = Fernet(key)

    def encrypt_data(self, data):
        """Encripta datos"""
        return self.fernet.encrypt(data.encode())

    def decrypt_data(self, encrypted_data):
        """Desencripta datos"""
        return self.fernet.decrypt(encrypted_data).decode()

    def hash_password(self, password):
        """Hashea contraseña (simple para demo)"""
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

    def validate_connection(self, device):
        """Valida conexión segura (placeholder)"""
        # Implementar verificación de certificados ADB
        return True