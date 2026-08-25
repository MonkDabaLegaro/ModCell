import logging
from adb_connector import AdbConnector

logger = logging.getLogger(__name__)

class AppManager:
    def __init__(self, adb_connector):
        self.adb = adb_connector

    def list_installed_apps(self, device=None, system=False):
        """Lista aplicaciones instaladas"""
        command = "pm list packages"
        if system:
            command += " -s"  # Solo system apps
        else:
            command += " -3"  # Solo third party
        stdout, stderr, code = self.adb.run_command(command, device)
        if code == 0:
            packages = []
            for line in stdout.strip().split('\n'):
                if line.startswith('package:'):
                    packages.append(line.split('package:')[1])
            return packages
        return []

    def install_app(self, apk_path, device=None):
        """Instala una app desde APK"""
        stdout, stderr, code = self.adb.run_command(f"install {apk_path}", device)
        return code == 0, stdout + stderr

    def uninstall_app(self, package_name, device=None):
        """Desinstala una app"""
        stdout, stderr, code = self.adb.run_command(f"uninstall {package_name}", device)
        return code == 0, stdout + stderr

    def get_app_info(self, package_name, device=None):
        """Obtiene información de una app"""
        stdout, stderr, code = self.adb.run_command(f"pm dump {package_name}", device)
        if code == 0:
            return stdout
        return None

    def clear_app_data(self, package_name, device=None):
        """Limpia datos de una app"""
        stdout, stderr, code = self.adb.run_command(f"pm clear {package_name}", device)
        return code == 0

    def repair_app(self, package_name, device=None):
        """Repara app reinstalando o limpiando datos"""
        # Intentar clear data primero
        if self.clear_app_data(package_name, device):
            logger.info(f"Datos limpiados para {package_name}")
            return True
        # Si falla, podría necesitar reinstalar, pero requiere APK
        return False

    def backup_data(self, package_name, backup_file, device=None):
        """Hace backup de datos de una app"""
        stdout, stderr, code = self.adb.run_command(f"backup -f {backup_file} {package_name}", device)
        return code == 0

    def restore_data(self, backup_file, device=None):
        """Restaura datos desde backup"""
        stdout, stderr, code = self.adb.run_command(f"restore {backup_file}", device)
        return code == 0

    def remove_system_app(self, package_name, device=None):
        """Elimina una app del sistema (requiere root)"""
        stdout, stderr, code = self.adb.run_command(f"shell su -c 'pm uninstall {package_name}'", device)
        return code == 0