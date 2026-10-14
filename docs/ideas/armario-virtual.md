# Armario virtual

Resumen de la idea, afinada de nuevo el 14 de octubre de 2026 tras evaluarla
([evaluación](../ventures/evaluations/2026-10-14-armario-virtual-eval.md)). Describe qué se quiere
construir, qué hay que comprobar antes y qué queda fuera a propósito.

## Problema

¿Cómo podríamos hacer que una mujer de 20 a 35 años con mucha ropa monte en segundos un conjunto
para una cena, una fiesta o un evento, viéndolo sobre un cuerpo como el suyo, sin tener que
fotografiar antes todo su armario?

Hoy se prueba cinco conjuntos delante del espejo y deja la cama llena de ropa, manda fotos a una
amiga por WhatsApp, busca ideas en Pinterest o Instagram, usa apps como Whering, Cladwell o Indyx, o
acaba comprando algo nuevo. Esas apps exigen meter el armario entero antes de servir para algo, y
ese esfuerzo es lo que hace que se abandonen.

## Dirección elegida

**Primero, «el armario que se llena solo»; después, «¿me lo compro?».**

Las prendas no se catalogan por adelantado: se meten solo cuando vas a usarlas, por foto o pegando
una captura de la tienda (o, en Android, compartiendo la imagen desde la app de la tienda). Cada conjunto que eliges se
guarda como lo que te pusiste en tal ocasión. Así el armario se va llenando con el uso, y la
siguiente vez partes de conjuntos reales y no de prendas sueltas.

La segunda fase usa ese armario. Haces una captura de algo que estás pensando comprar y lo ves
combinado con lo que ya tienes. Va después porque sin armario guardado no hay con qué combinar; y
abre una forma de cubrir costes: Shein tiene programa de afiliados. Inditex, hasta donde sabemos,
no lo tiene.

Todo sigue guardado en el dispositivo, sin cuentas y sin servidor: leer el enlace de la tienda se
descartó porque las tiendas lo bloquean. El maniquí 2D actual basta para comprobar si la idea sirve;
el cuerpo 3D (`#cuerpo`) pasa a ser una mejora, no la base.

Dedicación prevista: 5–10 horas a la semana. Objetivo: probarla con amigas y que el proyecto pague
sus costes.

## Supuestos por comprobar

- [x] **Los enlaces de Zara y Shein se pueden leer, al menos la imagen de la prenda.** No:
  comprobado el 14 de octubre de 2026, las seis tiendas probadas bloquean la lectura desde un
  servidor ([prueba](../pruebas/2026-10-14-enlaces-de-tienda.md)). El enlace se sustituye por una
  captura de pantalla de la tienda o, en Android, por compartir la imagen desde su app.
- [ ] **Una captura de la tienda da una prenda usable en el maniquí.** Con 5 capturas reales de Zara
  y Shein (con modelo, sin modelo y en «flat lay») pasadas por el recorte actual.
- [ ] **El problema se repite y lo resuelven con lo que tienen.** Seis entrevistas, al menos tres con
  mujeres que no sean amigas cercanas, preguntando por la última vez (no por opiniones): qué
  hicieron, si han probado apps de armario y por qué las dejaron, y qué parte de lo que se pusieron
  compraron online y si sabrían encontrar el enlace. Se descarta si menos de 3 de 6 lo cuentan sin
  sugerírselo.
- [ ] **Meter prendas al usarlas basta para tener un armario útil.** Con 5 probadoras durante dos
  meses. Se descarta si la mediana queda por debajo de 10 prendas.
- [ ] **Abren la app antes de salir.** Se descarta si menos de 3 de 8 probadoras la usan por
  iniciativa propia antes de un evento real en 90 días.
- [x] **El cuerpo 3D conserva sus controles de forma al llevarlo a la web.** Comprobado el 14 de
  octubre de 2026: los cuerpos de MakeHuman se exportan con sus formas (unos 2,4 MB cada uno) y los
  controles los deforman en el navegador, pelo incluido. Ver `modelos/cuerpo.py` y la pantalla
  `#cuerpo`.

## Alcance mínimo

Fase A, el armario que se llena solo:

- Añadir una prenda por foto (ya funciona) o por captura de la tienda, con su tipo (arriba o abajo).
- Guardar las prendas en el dispositivo, para que no se pierdan al cerrar la página.
- Vestir el maniquí 2D eligiendo del armario guardado.
- Guardar el conjunto elegido con un nombre de ocasión, y poder volver a él.

Fase B, ¿me lo compro? (solo si A se usa):

- Meter por captura una prenda que no tienes y verla con las tuyas.
- Enlace de afiliado de Shein en esa prenda.

## Lo que no vamos a hacer, y por qué

- **Prendas 3D sobre el cuerpo 3D, por ahora.** Es lo más caro y no hace falta para saber si la app
  sirve. El cuerpo 3D ya existe y se retoma cuando A funcione.
- **Importar los pedidos desde el correo.** Llenaría el armario de golpe, pero obliga a pedir
  acceso al correo y a tener servidor, justo lo contrario de la privacidad que se ofrece.
- **Votación de conjuntos por WhatsApp.** Era la única variante con difusión propia; para probar
  con amigas no hace falta. Si el proyecto crece, es lo primero que añadir.
- **Leer el enlace de la tienda.** Las tiendas lo bloquean, y saltarse sus protecciones es frágil
  y va contra sus condiciones ([prueba](../pruebas/2026-10-14-enlaces-de-tienda.md)).
- **Cuentas y sincronización entre dispositivos.** Añade servidor y datos personales antes de saber
  si la app gusta.
- **Sugerencias automáticas de conjuntos.** No prueba nada de lo que hay que comprobar.
- **Calzado, accesorios y abrigos.** Se empieza por arriba y abajo.

## Preguntas abiertas

- ¿Cómo se ve una prenda de tienda en el maniquí 2D? La foto principal de muchas tiendas lleva modelo,
  y quitar a la persona es más difícil que quitar el fondo. Hay que ver en la prueba técnica qué
  imagen devuelve cada tienda.
- ¿Da el programa de afiliados de Shein acceso oficial a las imágenes de producto?
- ¿Las fotos de tienda dan problemas de derechos si se guardan solo en el móvil de quien las usa?
  Probablemente no, pero hay que confirmarlo antes de la fase B.

## Direcciones que se valoraron

- **Cuerpo 3D ajustable con catálogo de prendas 3D** (dirección anterior, del 14 de octubre de
  2026). Se aparca: la evaluación mostró que el riesgo principal no es el 3D sino el esfuerzo de
  meter la ropa.
- **«Esta noche»: solo 3–5 candidatas, sin armario.** Muy simple, pero no acumula nada entre usos.
- **Solo «¿me lo compro?».** Compite de frente con los probadores de las tiendas y necesita un
  armario guardado para tener sentido.
