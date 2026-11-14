# Panel de Cauce — instalación (15 min, una sola vez)

Todo funciona sobre tu propia cuenta de Google. Coste: 0 €.

## 1. Crear el proyecto
1. Entra en https://script.google.com y pulsa **Nuevo proyecto**.
2. Ponle de nombre **Panel Cauce**.
3. Borra lo que haya en `Código.gs` y pega el contenido de `panel-src/Code.gs`.
4. Pulsa el **+** junto a *Archivos* → **HTML**, llámalo `Index` y pega dentro `panel-src/Index.html`.
5. Guarda (Ctrl+S).

## 2. Crear la hoja de datos
1. Arriba, en el selector de función, elige **instalar** y pulsa **Ejecutar**.
2. Acepta los permisos que pide (son tu Calendar/Drive/Gmail: los usa para guardar los datos y avisarte).
3. Se crea sola la hoja **Cauce · Analítica web** en tu Drive.

## 3. Publicar dos implementaciones
**A) API pública** (es la que recibe las visitas de la web)
- **Implementar → Nueva implementación → Aplicación web**
- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario**
- Copia la URL que acaba en `/exec` → esta es tu `CAUCE_API`.

**B) Panel privado** (solo tú)
- **Implementar → Nueva implementación → Aplicación web**
- Ejecutar como: **Usuario que accede**
- Quién tiene acceso: **Solo yo**
- Copia la URL `/exec` → esta es tu `PANEL_URL`.

## 4. Conectar la web
1. En `panel.html`, sustituye `__PANEL_URL__` por la URL del panel (B).
2. Construye la web con la API pública (A):
   ```
   CAUCE_API='https://script.google.com/macros/s/XXXX/exec' python3 build_cauce.py
   ```
3. Sube los cambios a GitHub.

## 5. Comprobar
- Abre la web, muévete un poco y rellena el formulario.
- Abre `panel.html`: deberías ver 1 visitante y 1 solicitud, y tener un email en tu correo.
- Si ves datos de pruebas que no quieres, ejecuta la función **borrarPruebas** desde el editor.

## Qué guarda
Solo lo necesario para saber cómo va la web: página, origen (WhatsApp, Google, Instagram…), tipo de
dispositivo, ancho de pantalla, hasta dónde bajan y cuánto tiempo están. Sin cookies, sin IP y sin
datos personales, salvo los que la propia persona escribe en el formulario.
