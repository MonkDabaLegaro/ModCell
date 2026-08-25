import subprocess
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdbConnector:
    def __init__(self, adb_path=None):
        if adb_path is None:
            # Asumir que adb está en PATH o usar ruta relativa
            adb_path = "adb"  # Cambiar a ruta completa si necesario
        self.adb_path = adb_path

    def run_command(self, command, device=None):
        """Ejecuta un comando ADB y retorna stdout, stderr, returncode"""
        full_command = [self.adb_path]
        if device:
            full_command.extend(["-s", device])
        full_command.extend(command.split())
        try:
            result = subprocess.run(full_command, capture_output=True, text=True, timeout=30)
            logger.info(f"Comando ejecutado: {' '.join(full_command)}")
            return result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired:
            logger.error("Comando ADB timeout")
            return "", "Timeout", 1
        except Exception as e:
            logger.error(f"Error ejecutando comando: {e}")
            return "", str(e), 1

    def detect_devices(self):
        """Lista dispositivos conectados"""
        stdout, stderr, code = self.run_command("devices")
        if code == 0:
            lines = stdout.strip().split('\n')[1:]  # Saltar la primera línea
            devices = []
            for line in lines:
                if line.strip():
                    parts = line.split()
                    if len(parts) >= 2:
                        devices.append({"id": parts[0], "status": parts[1]})
            return devices
        return []

    def connect_wifi(self, ip, port=5555):
        """Conecta a dispositivo via WiFi"""
        stdout, stderr, code = self.run_command(f"connect {ip}:{port}")
        return code == 0

    def disconnect(self, device=None):
        """Desconecta dispositivo"""
        command = "disconnect"
        if device:
            command += f" {device}"
        stdout, stderr, code = self.run_command(command)
        return code == 0

    def start_mirroring(self, device, scrcpy_path=None):
        """Inicia mirroring de pantalla con scrcpy"""
        if scrcpy_path is None:
            scrcpy_path = "scrcpy"  # Asumir en PATH
        command = [scrcpy_path, "-s", device]
        try:
            subprocess.Popen(command)  # Ejecutar en background
            logger.info(f"Mirroring iniciado para {device}")
            return True
        except Exception as e:
            logger.error(f"Error iniciando mirroring: {e}")
            return False

    def is_rooted(self, device=None):
        """Verifica si el dispositivo tiene root"""
        stdout, stderr, code = self.run_command("shell su -c id", device)
        if code == 0 and "uid=0" in stdout:
            return True
        return False

    def get_android_version(self, device=None):
        """Obtiene la versión de Android (API level)"""
        stdout, stderr, code = self.run_command("shell getprop ro.build.version.sdk", device)
        if code == 0:
            return int(stdout.strip())
        return None

    def get_manufacturer(self, device=None):
        """Obtiene el fabricante del dispositivo"""
        stdout, stderr, code = self.run_command("shell getprop ro.product.manufacturer", device)
        if code == 0:
            return stdout.strip().lower()
        return None