import logging
from adb_connector import AdbConnector

logger = logging.getLogger(__name__)

class PermissionManager:
    def __init__(self, adb_connector):
        self.adb = adb_connector

    def list_permissions(self, package_name, device=None):
        """Lista permisos de una app"""
        stdout, stderr, code = self.adb.run_command(f"shell pm list permissions {package_name}", device)
        if code == 0:
            permissions = []
            for line in stdout.strip().split('\n'):
                if line.startswith('permission:'):
                    permissions.append(line.split('permission:')[1])
            return permissions
        return []

    def grant_permission(self, package_name, permission, device=None):
        """Otorga un permiso a una app"""
        stdout, stderr, code = self.adb.run_command(f"shell pm grant {package_name} {permission}", device)
        return code == 0

    def revoke_permission(self, package_name, permission, device=None):
        """Revoca un permiso de una app"""
        stdout, stderr, code = self.adb.run_command(f"shell pm revoke {package_name} {permission}", device)
        return code == 0

    def check_permission(self, package_name, permission, device=None):
        """Verifica si una app tiene un permiso"""
        stdout, stderr, code = self.adb.run_command(f"shell pm list permissions {package_name}", device)
        if code == 0:
            return permission in stdout
        return False