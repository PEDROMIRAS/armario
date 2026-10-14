# Armario virtual

Resumen de la idea, afinada por tercera vez el 14 de octubre de 2026, por la noche, tras evaluarla
([evaluación](../ventures/evaluations/2026-10-14-armario-virtual-eval.md)). Describe qué se quiere
construir, qué hay que comprobar antes y qué queda fuera a propósito.

## Problema

¿Cómo podríamos hacer que una mujer de 20 a 35 años elija qué ponerse para una cena o un evento
abriendo su armario en el móvil, viendo cada conjunto sobre un maniquí con su tono de piel, sin
probárselo, y sin que el catálogo de prendas 3D sea un trabajo sin fin?

Hoy se prueba cinco conjuntos delante del espejo y deja la cama llena de ropa, manda fotos a una
amiga por WhatsApp, busca ideas en Pinterest o Instagram, usa apps como Whering, Cladwell o Indyx, o
acaba comprando algo nuevo. Esas apps exigen meter el armario entero antes de servir para algo, y
ese esfuerzo es lo que hace que se abandonen.

## Dirección elegida

**Primero, «el armario que se llena solo»; después, «¿me lo compro?».** Sigue valiendo.

Las prendas no se catalogan por adelantado: se meten solo cuando vas a usarlas, por foto o pegando
una captura de la tienda (o, en Android, compartiendo la imagen desde la app de la tienda). Cada
conjunto que eliges se guarda como lo que te pusiste en tal ocasión. Así el armario se va llenando
con el uso, y la siguiente vez partes de conjuntos reales y no de prendas sueltas. La segunda fase,
«¿me lo compro?», usa ese armario: ves combinado con lo tuyo algo que estás pensando comprar. Va
después porque sin armario guardado no hay con qué combinar.

Todo guardado en el dispositivo, sin cuentas y sin servidor. **Solo el maniquí 3D**: la foto de
cada prenda se pone como tela de una prenda 3D del catálogo de MakeHuman sobre el cuerpo ajustable.

**Siguiente: la tijera, después la habitación y después las amigas** (decidido el 14 de octubre de
2026, por la noche). El freno de hoy es que cada forma de prenda es una malla nueva hecha en el
sobremesa, y el catálogo no se acaba nunca. Se sustituye por **una prenda larga por familia que se
recorta con controles**: cada vértice guarda lo lejos que está del hombro y de la cintura, y el
shader esconde la tela a partir del valor elegido. De un vestido midi salen el
mini, el de rodilla y el midi (el paquete no trae ninguno largo con manga larga); si además se corta por arriba, quizá una falda. El
catálogo pasa a ser números guardados con cada prenda, no mallas.

Con eso, el maniquí se acerca a quien lo usa por lo barato: **tono de piel y color de pelo**.
Después, **la habitación fija**: el armario abierto, con perchas que son tus prendas guardadas, y el
maniquí delante como espejo. Tocas una percha y se la pone. No se recorre andando: antes de salir
hay prisa. Es lo divertido del proyecto y lo que la distingue de la cuadrícula de Whering.

La habitación tiene un límite de **unas 15 horas**. Al terminarla, o al agotarse ese tiempo, lo que
llegue antes, se le da la app a 3 amigas antes de un evento real y se mira cómo la usan, sin
entrevista.

Dedicación prevista: 5–10 horas a la semana. Objetivo: probarla con amigas y que el proyecto pague
sus costes. Es tanto un proyecto para que se use como para disfrutar haciendo 3D.

## Supuestos por comprobar

- [x] **Los enlaces de Zara y Shein se pueden leer, al menos la imagen de la prenda.** No:
  comprobado el 14 de octubre de 2026, las seis tiendas probadas bloquean la lectura desde un
  servidor ([prueba](../pruebas/2026-10-14-enlaces-de-tienda.md)). El enlace se sustituye por una
  captura de pantalla de la tienda o, en Android, por compartir la imagen desde su app.
- [x] **Una imagen de tienda da una prenda usable en el maniquí.** Solo si es la foto de la prenda
  sola. Comprobado el 14 de octubre de 2026 con 5 imágenes de Zara: con modelo, el recorte deja a la
  persona entera ([prueba](../pruebas/2026-10-14-enlaces-de-tienda.md)). La app debe pedir la foto
  de la prenda sola y añadir un hueco «vestido».
- [x] **El cuerpo 3D conserva sus controles de forma al llevarlo a la web.** Comprobado el 14 de
  octubre de 2026: los cuerpos de MakeHuman se exportan con sus formas (unos 2,4 MB cada uno) y los
  controles los deforman en el navegador, pelo incluido. Ver `modelos/cuerpo.py` y la pantalla
  `#cuerpo`.
- [ ] **El corte queda limpio.** Una tarde en el sobremesa: el vestido largo con el número por
  vértice, visto de frente, de lado y de espaldas con tres cortes. No vale si el borde sale en
  dientes de sierra o el interior de la tela se ve raro.
- [ ] **Las piernas no desaparecen al acortar.** Es el que puede romper la tijera. Hoy la piel bajo
  el vestido se esconde entera (material `bajo_vestido`); tiene que respetar el mismo corte. No vale
  si con el mini se ve un hueco o la piel atraviesa la tela.
- [ ] **Un largo recortado parece un mini.** Se compara con la foto de un vestido mini de tienda. Si
  no pasa, se añade `toigo_halter_dress_knee_length` del mismo paquete como segunda base.
- [ ] **Una foto real da una tela creíble sobre la prenda 3D.** Primer intento, proyectar la foto
  entera de frente: no vale, porque su forma (cuello, mangas, prenda extendida, modelo) nunca coincide
  con la de la prenda 3D. Segundo, el actual: un trozo de tela limpio y uniforme de la foto, sin la luz
  de la foto, repetido alrededor de la prenda a su tamaño real. Con fotos de Zara con modelo y con
  imágenes de prueba de rayas y vaquero queda limpio por delante, por los lados y por detrás. Falta
  con prendas de verdad: una lisa, una de tejido marcado y una con estampado grande. Se pierde el
  dibujo grande en su sitio (un logo en el pecho). Lo blanco sobre fondo blanco se pierde al recortar.
- [ ] **La habitación funciona en el móvil.** Con 20 prendas en perchas: que se lean, que se mueva
  con fluidez en el móvil de Pedro y que el peso total no pase de unos 8 MB.
- [ ] **La usan antes de un evento real.** Con 3 amigas, mirando cómo la usan: al menos 2 eligen
  con ella lo que se ponen. Si ninguna lo hace, se revisa la idea antes de seguir con 3D. Sustituye
  a las seis entrevistas de la evaluación: Pedro prefiere aprender viendo el uso.
- [ ] **Meter prendas al usarlas basta para tener un armario útil.** Con las probadoras durante dos
  meses. Se descarta si la mediana queda por debajo de 10 prendas.

## Alcance mínimo

Hecho el 14 de octubre de 2026:

- Añadir una prenda por foto o por captura de la tienda, con su tipo (arriba o abajo).
- Guardar las prendas en el dispositivo, para que no se pierdan al cerrar la página.
- Vestir el maniquí 3D eligiendo del armario guardado, con la foto como tela de la prenda.
- Guardar el conjunto elegido con un nombre de ocasión, y poder volver a él.

Siguiente, por orden:

1. ~~El vestido 3D~~ ([plan](../planes/2026-10-14-vestido-3d.md)). Hecho el 14 de octubre de 2026,
   El paquete Dress 01 no trae ningún vestido largo y con manga larga a la vez. Primero se probó la
   túnica `wdg_mycenaean_tunic`, que tiene manga, pero en el navegador parecía un camisón; se quedó
   la halter midi, entallada y sin mangas. La tijera solo recortará el bajo (midi, rodilla, mini):
   la manga queda fuera.
2. La tijera en el vestido: el largo del bajo, con la piel respetando el corte.
3. Los valores de corte guardados con cada prenda del armario.
4. Tono de piel y color de pelo.
5. La habitación fija, con perchas y el maniquí como espejo (unas 15 horas como máximo).
6. Prueba con 3 amigas.

Fase B, ¿me lo compro? (solo si se usa):

- Meter por captura una prenda que no tienes y verla con las tuyas.
- Enlace de afiliado de Shein en esa prenda.

## Lo que no vamos a hacer, y por qué

- **Más mallas de prenda.** Lo que no salga de recortar la camiseta, el pantalón y el vestido, no
  existe. Es lo que hacía que el trabajo no se acabara.
- **Pecho, cintura y cadera en el maniquí.** Cada forma va en el cuerpo, en el pelo y en cada prenda,
  y suma alrededor de 1 MB a cada `.glb`. Vuelve si las amigas dicen «no me parezco».
- **Recorrer la habitación andando.** Es más lento que una cuadrícula justo cuando hay prisa.
- **Tirantes, escotes y cuellos distintos.** La tijera solo acorta, no cambia la forma.
- **Foto en el espejo para meter un conjunto entero** (separar la ropa de una foto puesta). Es la
  que más ayudaría a que la usen, pero primero hay que ver si meter las prendas de una en una frena a
  las amigas. Es lo primero que añadir si les cuesta.
- **Entrevistas.** Se aprende mirando a las amigas usarla.
- **La silueta 2D.** Se quitó al pasar a solo 3D.
- **Importar los pedidos desde el correo.** Llenaría el armario de golpe, pero obliga a pedir
  acceso al correo y a tener servidor, justo lo contrario de la privacidad que se ofrece.
- **Votación de conjuntos por WhatsApp.** Era la única variante con difusión propia; para probar
  con amigas no hace falta. Si el proyecto crece, es lo primero que añadir.
- **Leer el enlace de la tienda.** Las tiendas lo bloquean, y saltarse sus protecciones es frágil
  y va contra sus condiciones ([prueba](../pruebas/2026-10-14-enlaces-de-tienda.md)).
- **Cuentas y sincronización entre dispositivos.** Añade servidor y datos personales antes de saber
  si la app gusta.
- **Sugerencias automáticas de conjuntos.** No prueba nada de lo que hay que comprobar.
- **Calzado, accesorios y abrigos.** Se empieza por arriba, abajo y vestido.

## Preguntas abiertas

- ¿La falda sale de recortar el vestido por arriba o hace falta otra base?
- ¿Las perchas muestran la foto de la prenda o una miniatura 3D?
- ¿Qué habitación: un modelo CC0 ya hecho o una sencilla hecha en Blender? Depende del peso.
- ¿El cuerpo de hombre necesita tijera, o le basta con camiseta y pantalón?
- ¿Da el programa de afiliados de Shein acceso oficial a las imágenes de producto?
- ¿Las fotos de tienda dan problemas de derechos si se guardan solo en el móvil de quien las usa?
  Probablemente no, pero hay que confirmarlo antes de la fase B.
- ¿De dónde salen las prendas 3D? **Del catálogo libre de MakeHuman.** Comprobado el 14 de octubre
  de 2026: siguen al cuerpo en los extremos de altura y complexión, porque MakeHuman reajusta la
  prenda a cada forma igual que el pelo. La tela ceñida deja asomar el cuerpo, y se resuelve como en
  MakeHuman: cada prenda dice qué parte del cuerpo tapa, y esa parte no se pinta. El paquete CC0
  trae sobre todo conjuntos enteros en dos piezas, de donde salen la camiseta y el pantalón; el
  vestido sale del paquete Dress 01.

## Direcciones que se valoraron

- **Catálogo cerrado de cinco formas** (camiseta, pantalón, vestido, falda, top). Pone fin al
  trabajo, pero sigue siendo una malla por forma; la tijera da más con menos.
- **El maniquí eres tú, entero** (todas las formas del cuerpo). Apunta a la duda real, «¿me queda
  bien?», pero cada forma multiplica el peso de cada prenda. Se queda solo lo barato: piel y pelo.
- **Habitación navegable, armario reconocido por foto, probador entre amigas.** La versión grande;
  sirve para saber hacia dónde se va, no para ahora.
- **Cuerpo 3D ajustable con catálogo de prendas 3D** (dirección anterior). Se aparcó cuando la
  evaluación mostró que el riesgo principal era el esfuerzo de meter la ropa.
- **«Esta noche»: solo 3–5 candidatas, sin armario.** Muy simple, pero no acumula nada entre usos.
- **Solo «¿me lo compro?».** Compite de frente con los probadores de las tiendas y necesita un
  armario guardado para tener sentido.
