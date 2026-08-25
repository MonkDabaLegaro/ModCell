#!/usr/bin/env python3
"""
Compilador Automático para Modificador de Teléfono
Este script compila el proyecto principal en un ejecutable y lo ejecuta automáticamente.
"""

import os
import sys
import subprocess
import shutil
import time
from pathlib import Path

class ProjectCompiler:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.main_script = self.project_root / "main.py"
        self.build_dir = self.project_root / "build"
        self.dist_dir = self.project_root / "dist"
        self.output_exe = self.dist_dir / "Modificador_de_Telefono.exe"
        
    def check_python_dependencies(self):
        """Verifica que Python y PyInstaller estén instalados"""
        print("🔍 Verificando dependencias...")
        
        # Verificar Python
        try:
            result = subprocess.run([sys.executable, "--version"], 
                                  capture_output=True, text=True)
            print(f"✅ Python encontrado: {result.stdout.strip()}")
        except Exception as e:
            print(f"❌ Error con Python: {e}")
            return False
            
        # Verificar e instalar PyInstaller
        try:
            import PyInstaller
            print("✅ PyInstaller ya está instalado")
        except ImportError:
            print("📦 Instalando PyInstaller...")
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], 
                             check=True)
                print("✅ PyInstaller instalado correctamente")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error instalando PyInstaller: {e}")
                return False
                
        return True
        
    def create_pyinstaller_spec(self):
        """Crea archivo de configuración para PyInstaller"""
        spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['{self.main_script.name}'],
    pathex=['{self.project_root}'],
    binaries=[
        ('platform-tools/platform-tools/adb.exe', 'platform-tools/platform-tools'),
        ('platform-tools/platform-tools/fastboot.exe', 'platform-tools/platform-tools'),
        ('scrcpy/scrcpy-win64-v2.4/scrcpy.exe', 'scrcpy/scrcpy-win64-v2.4'),
    ],
    datas=[
        ('logs', 'logs'),
        ('docs', 'docs'),
        ('src', 'src'),
    ],
    hiddenimports=[
        'PyQt5.QtWidgets',
        'PyQt5.QtCore',
        'PyQt5.QtGui',
        'cryptography',
        'cryptography.fernet',
        'adb_connector',
        'app_manager',
        'permission_manager',
        'security',
        'ui.main_window'
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Modificador_de_Telefono',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
'''
        
        spec_file = self.project_root / "build_spec.py"
        with open(spec_file, 'w', encoding='utf-8') as f:
            f.write(spec_content)
            
        print("✅ Archivo de configuración PyInstaller creado")
        return spec_file
        
    def clean_build_dirs(self):
        """Limpia directorios de build anteriores"""
        print("🧹 Limpiando directorios anteriores...")
        
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        if self.dist_dir.exists():
            shutil.rmtree(self.dist_dir)
            
        print("✅ Directorios limpiados")
        
    def run_pyinstaller(self):
        """Ejecuta PyInstaller para crear el ejecutable"""
        print("🔨 Iniciando compilación con PyInstaller...")
        
        spec_file = self.create_pyinstaller_spec()
        
        try:
            # Ejecutar PyInstaller
            cmd = [sys.executable, "-m", "PyInstaller", "--clean", "--noconfirm", str(spec_file)]
            result = subprocess.run(cmd, cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Compilación exitosa!")
                return True
            else:
                print(f"❌ Error en compilación:")
                print(result.stderr)
                return False
                
        except Exception as e:
            print(f"❌ Error ejecutando PyInstaller: {e}")
            return False
            
    def run_compiled_exe(self):
        """Ejecuta el ejecutable compilado"""
        if self.output_exe.exists():
            print(f"🚀 Ejecutando {self.output_exe.name}...")
            try:
                subprocess.Popen([str(self.output_exe)])
                print("✅ Aplicación ejecutándose!")
                return True
            except Exception as e:
                print(f"❌ Error ejecutando la aplicación: {e}")
                return False
        else:
            print(f"❌ No se encontró el ejecutable: {self.output_exe}")
            return False
            
    def compile_and_run(self):
        """Proceso completo de compilación y ejecución"""
        print("=" * 60)
        print("🔧 COMPILADOR AUTOMÁTICO - MODIFICADOR DE TELÉFONO")
        print("=" * 60)
        
        start_time = time.time()
        
        # Verificar archivo principal
        if not self.main_script.exists():
            print(f"❌ No se encontró el archivo principal: {self.main_script}")
            return False
            
        # Proceso de compilación
        steps = [
            ("Verificando dependencias", self.check_python_dependencies),
            ("Limpiando directorios", self.clean_build_dirs),
            ("Compilando proyecto", self.run_pyinstaller),
        ]
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            if not step_func():
                print(f"❌ Falló: {step_name}")
                return False
                
        # Ejecutar aplicación compilada
        print(f"\n📋 Ejecutando aplicación compilada...")
        if self.run_compiled_exe():
            elapsed = time.time() - start_time
            print(f"\n🎉 Proceso completado en {elapsed:.1f} segundos!")
            return True
        else:
            return False
            
    def show_help(self):
        """Muestra información de ayuda"""
        print("""
🔧 COMPILADOR AUTOMÁTICO - MODIFICADOR DE TELÉFONO

Este compilador automatiza el proceso de:
1. Verificar dependencias (Python, PyInstaller)
2. Compilar tu proyecto Python en un ejecutable
3. Incluir herramientas ADB y scrcpy
4. Ejecutar automáticamente el resultado

USO:
- Ejecuta este script: python compiler.py
- O haz doble clic en compilar.bat

ARCHIVOS GENERADOS:
- dist/Modificador_de_Telefono.exe (ejecutable final)
- build/ (archivos temporales de compilación)
        """)

def main():
    compiler = ProjectCompiler()
    
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        compiler.show_help()
        return
        
    success = compiler.compile_and_run()
    
    if success:
        print("\n💡 Consejo: El ejecutable se encuentra en la carpeta 'dist'")
        input("\nPresiona Enter para continuar...")
    else:
        print("\n❌ La compilación falló. Revisa los errores arriba.")
        input("Presiona Enter para continuar...")
        sys.exit(1)

if __name__ == "__main__":
    main()
