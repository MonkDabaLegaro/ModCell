from PyQt5.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QPushButton, QTableWidget, QTableWidgetItem, QProgressBar, QMessageBox, QSystemTrayIcon, QMenu
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QIcon
import logging

logger = logging.getLogger(__name__)

class MainWindow(QMainWindow):
    def __init__(self, adb_connector, app_manager, permission_manager):
        super().__init__()
        self.adb = adb_connector
        self.app_manager = app_manager
        self.permission_manager = permission_manager
        self.current_device = None
        self.init_ui()
        self.setup_tray()

    def init_ui(self):
        self.setWindowTitle("Gestor de Aplicaciones Móviles")
        self.setGeometry(100, 100, 800, 600)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QHBoxLayout(central_widget)

        # Panel izquierdo: Dispositivos
        left_panel = QVBoxLayout()
        self.device_list = QListWidget()
        self.device_list.itemClicked.connect(self.select_device)
        refresh_btn = QPushButton("Refrescar Dispositivos")
        refresh_btn.clicked.connect(self.refresh_devices)
        left_panel.addWidget(self.device_list)
        left_panel.addWidget(refresh_btn)

        # Panel derecho: Aplicaciones
        right_panel = QVBoxLayout()
        self.app_table = QTableWidget()
        self.app_table.setColumnCount(4)
        self.app_table.setHorizontalHeaderLabels(["Nombre", "Paquete", "Tamaño", "Estado"])
        refresh_apps_btn = QPushButton("Refrescar Apps")
        refresh_apps_btn.clicked.connect(self.refresh_apps)
        install_btn = QPushButton("Instalar APK")
        install_btn.clicked.connect(self.install_apk)
        uninstall_btn = QPushButton("Desinstalar")
        uninstall_btn.clicked.connect(self.uninstall_app)
        repair_btn = QPushButton("Reparar")
        repair_btn.clicked.connect(self.repair_app)
        mirror_btn = QPushButton("Iniciar Mirroring")
        mirror_btn.clicked.connect(self.start_mirroring)
        right_panel.addWidget(self.app_table)
        right_panel.addWidget(refresh_apps_btn)
        right_panel.addWidget(install_btn)
        right_panel.addWidget(uninstall_btn)
        right_panel.addWidget(repair_btn)
        right_panel.addWidget(mirror_btn)

        # Barra de progreso
        self.progress_bar = QProgressBar()
        right_panel.addWidget(self.progress_bar)

        layout.addLayout(left_panel)
        layout.addLayout(right_panel)

        self.refresh_devices()

    def setup_tray(self):
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon("icon.png"))  # Asumir icono
        tray_menu = QMenu()
        show_action = tray_menu.addAction("Mostrar")
        show_action.triggered.connect(self.show)
        quit_action = tray_menu.addAction("Salir")
        quit_action.triggered.connect(self.close)
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.show()

    def refresh_devices(self):
        self.device_list.clear()
        devices = self.adb.detect_devices()
        for device in devices:
            self.device_list.addItem(f"{device['id']} ({device['status']})")

    def select_device(self, item):
        device_id = item.text().split()[0]
        self.current_device = device_id
        self.refresh_apps()

    def refresh_apps(self):
        if not self.current_device:
            return
        self.app_table.setRowCount(0)
        apps = self.app_manager.list_installed_apps(self.current_device)
        for app in apps:
            row = self.app_table.rowCount()
            self.app_table.insertRow(row)
            self.app_table.setItem(row, 0, QTableWidgetItem(app))  # Nombre simplificado
            self.app_table.setItem(row, 1, QTableWidgetItem(app))
            self.app_table.setItem(row, 2, QTableWidgetItem("N/A"))
            self.app_table.setItem(row, 3, QTableWidgetItem("Instalada"))

    def closeEvent(self, event):
        self.tray_icon.hide()
        event.accept()

    def install_apk(self):
        if not self.current_device:
            QMessageBox.warning(self, "Error", "Selecciona un dispositivo primero.")
            return
        from PyQt5.QtWidgets import QFileDialog
        apk_path, _ = QFileDialog.getOpenFileName(self, "Seleccionar APK", "", "APK files (*.apk)")
        if apk_path:
            success, msg = self.app_manager.install_app(apk_path, self.current_device)
            if success:
                QMessageBox.information(self, "Éxito", "APK instalada correctamente.")
                self.refresh_apps()
            else:
                QMessageBox.warning(self, "Error", f"Error instalando APK: {msg}")

    def uninstall_app(self):
        if not self.current_device:
            QMessageBox.warning(self, "Error", "Selecciona un dispositivo primero.")
            return
        selected = self.app_table.currentRow()
        if selected < 0:
            QMessageBox.warning(self, "Error", "Selecciona una app para desinstalar.")
            return
        package = self.app_table.item(selected, 1).text()
        reply = QMessageBox.question(self, "Confirmar", f"¿Desinstalar {package}?", QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            success, msg = self.app_manager.uninstall_app(package, self.current_device)
            if success:
                QMessageBox.information(self, "Éxito", "App desinstalada.")
                self.refresh_apps()
            else:
                QMessageBox.warning(self, "Error", f"Error desinstalando: {msg}")

    def repair_app(self):
        if not self.current_device:
            QMessageBox.warning(self, "Error", "Selecciona un dispositivo primero.")
            return
        selected = self.app_table.currentRow()
        if selected < 0:
            QMessageBox.warning(self, "Error", "Selecciona una app para reparar.")
            return
        package = self.app_table.item(selected, 1).text()
        if self.app_manager.repair_app(package, self.current_device):
            QMessageBox.information(self, "Éxito", "App reparada.")
        else:
            QMessageBox.warning(self, "Error", "No se pudo reparar la app.")

    def start_mirroring(self):
        if not self.current_device:
            QMessageBox.warning(self, "Error", "Selecciona un dispositivo primero.")
            return
        if self.adb.start_mirroring(self.current_device):
            QMessageBox.information(self, "Éxito", "Mirroring iniciado.")
        else:
            QMessageBox.warning(self, "Error", "Error iniciando mirroring.")