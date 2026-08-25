import sys
from PyQt5.QtWidgets import QApplication
from src.adb_connector import AdbConnector
from src.app_manager import AppManager
from src.permission_manager import PermissionManager
from src.ui.main_window import MainWindow
import logging

logging.basicConfig(filename='logs/app.log', level=logging.INFO)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    adb = AdbConnector()
    app_mgr = AppManager(adb)
    perm_mgr = PermissionManager(adb)
    window = MainWindow(adb, app_mgr, perm_mgr)
    window.show()
    sys.exit(app.exec_())