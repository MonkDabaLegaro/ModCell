# Compilador Automático - Modificador de Teléfono

## 🎯 ¿Qué es?

Este compilador automático convierte tu proyecto Python en un ejecutable (.exe) que se puede ejecutar con **doble clic**, sin necesidad de tener Python instalado en el sistema objetivo.

## 🚀 Cómo Usar

### Opción 1: Doble Clic (Más Fácil)
1. Haz **doble clic** en el archivo `compilar.bat`
2. El sistema compilará automáticamente tu proyecto
3. ¡Listo! Tu aplicación se ejecutará automáticamente

### Opción 2: Línea de Comandos
```bash
python compiler.py
```

## 📁 Archivos Creados

Después de la compilación tendrás:

```
📂 dist/
   📄 Modificador_de_Telefono.exe  ← Tu aplicación compilada
📂 build/
   📄 (archivos temporales)
```

## ⚙️ Qué Hace el Compilador

1. **🔍 Verifica dependencias**: Python, PyInstaller
2. **🧹 Limpia**: Elimina compilaciones anteriores
3. **🔨 Compila**: Convierte Python a ejecutable
4. **🚀 Ejecuta**: Lanza automáticamente la aplicación
5. **📦 Incluye**: Herramientas ADB y scrcpy

## 🛠️ Funcionalidades Incluidas

### En el Ejecutable Final:
- ✅ Interfaz gráfica PyQt5
- ✅ Herramientas ADB (adb.exe, fastboot.exe)
- ✅ Scrcpy para mirror de pantalla
- ✅ Todas las dependencias Python
- ✅ Sin necesidad de Python en el sistema objetivo

## 📋 Requisitos Previos

Para usar el compilador necesitas:
- **Python 3.9+** instalado en tu sistema
- **pip** actualizado
- Conexión a internet (para descargar PyInstaller la primera vez)

## 🔧 Solución de Problemas

### Error: "Python no está instalado"
```bash
# Instalar dependencias manualmente si es necesario
pip install -r requirements.txt
```

### Error: "PyInstaller no encontrado"
- El compilador lo instala automáticamente
- O instálalo manualmente: `pip install pyinstaller`

### Error: "No se encontró main.py"
- Asegúrate de estar en el directorio correcto del proyecto
- El archivo `main.py` debe estar en la misma carpeta que `compiler.py`

## 📖 Uso Avanzado

### Compilar sin ejecutar:
```python
python compiler.py
# En compiler.py, comenta la línea: #compiler.run_compiled_exe()
```

### Personalizar el nombre del ejecutable:
- Edita `compiler.py`
- Cambia: `name='Modificador_de_Telefono'`

### Agregar más archivos al ejecutable:
- Edita `compiler.py` en la sección `binaries=` y `datos=`

## 🎉 ¡Listo!

Con un simple doble clic en `compilar.bat` tendrás tu aplicación ejecutándose sin necesidad de Python instalado en el sistema objetivo.

---

**Creado automáticamente para tu proyecto Modificador de Teléfono** 📱💻