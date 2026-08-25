@echo off
title Compilador Automático - Modificador de Teléfono
color 0A

echo.
echo ================================================================
echo  🔧 COMPILADOR AUTOMÁTICO - MODIFICADOR DE TELÉFONO
echo ================================================================
echo.
echo Iniciando compilación y ejecución automática...
echo.

:: Cambiar al directorio del script
cd /d "%~dp0"

:: Verificar que Python esté disponible
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python no está instalado o no está en el PATH
    echo.
    echo Por favor instala Python desde: https://python.org
    echo Asegúrate de marcar "Add Python to PATH" durante la instalación
    echo.
    pause
    exit /b 1
)

:: Ejecutar el compilador
python compiler.py

echo.
echo Compilación finalizada.
pause