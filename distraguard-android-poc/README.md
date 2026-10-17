# DistraGuard Android — Prueba Shorts 0.1

Primera prueba Android independiente para detectar la pestaña o un reproductor Shorts dentro de la app oficial de YouTube y ejecutar Atrás.

## Estado

Código fuente preparado. **Todavía NO se compiló un APK ni se probó en dispositivo real**. El bloqueo es experimental, no garantiza cubrir todas las versiones de YouTube.

- Solo la app oficial de YouTube (com.google.android.youtube).
- No hay filtros de palabras/canales todavía, ni sincronización con la web.
- No usa Internet, servidores, capturas ni almacena contenido privado.
- La activación es optativa, visible y reversible.
- No impide desinstalar la app, revocar Accesibilidad ni abrir YouTube normalmente.

## Compilación

Java 17, minSdk 28, compile/target SDK 36, AGP 8.12.0, Gradle 8.13.
Abrir la carpeta del proyecto en un IDE Android configurado con estos componentes. No se incluye APK, Gradle wrapper binario ni keystore.

Paquete de laboratorio: com.josenunezapps.distraguard.shortsprobe; diferente del paquete de la app definitiva para no sobreescribir instalaciones anteriores.

## Prueba en un Android real

1. Abrir DistraGuard, leer aviso y aceptar explícitamente uso de Accesibilidad.
2. En Ajustes del sistema, habilitar DistraGuard — Bloqueo de Shorts.
3. Regresar y comprobar «Protección en marcha».
4. Abrir YouTube con el botón y tocar Shorts.
5. La app **intentará** enviar Atrás al reconocer una señal fiable.
6. Revisar el contador de «Salidas de Shorts».
7. Abrir un video largo normal: no debe cerrarse.
8. Apagar interruptor o revocar autorización: no debe intervenir.

Si Android bloquea la activación por sus controles de seguridad para APKs descargados, no evitarlos; utilizar un método de instalación de desarrollo autorizado.

## Comprobar detector sin SDK Android

Usando javac desde el directorio de este proyecto:

javac -d build/smoke app/src/main/java/com/josenunezapps/distraguard/shortsprobe/ShortsDetector.java tests/ShortsDetectorSmokeTest.java

java -cp build/smoke ShortsDetectorSmokeTest

## Google Play

Esta app no declara isAccessibilityTool=true. Antes de una distribución por Google Play se necesitan los controles y declaraciones de política correspondientes, además de una evaluación real en teléfonos y compatibilidad.

## Fases posteriores

Tras validar la detección, estudiar sincronización segura del panel DistraGuard Web con Android y extensión Chrome. No se ha implementado esa sincronización.
