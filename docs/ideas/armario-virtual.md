# Armario virtual

Resumen de la idea tras afinarla el 14 de octubre de 2026. Describe qué se quiere construir, qué
hay que comprobar antes y qué queda fuera a propósito.

## Problema

¿Cómo podríamos hacer que cualquier persona registre su ropa en minutos y vea cómo queda conjuntada
sobre un cuerpo parecido al suyo, sin sacarla del armario?

## Dirección elegida

Un cuerpo 3D que cada persona ajusta con pocos controles, y un catálogo pequeño de prendas 3D que se
adaptan a ese cuerpo y toman el color y el tejido de las fotos del usuario. El cuerpo va dentro de
la app, construido sobre un modelo de licencia libre (MakeHuman, CC0), para no depender de ningún
servicio ajeno: el más conocido, Ready Player Me, cerró en enero de 2026.

El armario se guarda en el propio dispositivo, sin cuentas. Así cada persona puede usarla desde el
primer día sin servidor, sin costes y sin que nadie custodie fotos de otros.

Lo que hará que apetezca usarla es la velocidad de carga: una foto, un toque para decir qué prenda
es, y ya está en el armario.

## Supuestos por comprobar

- [x] **El cuerpo 3D conserva sus controles de forma al llevarlo a la web.** Comprobado el 14 de
  octubre de 2026: los cuerpos de MakeHuman se exportan con sus formas (unos 2,4 MB cada uno) y los
  controles los deforman en el navegador, pelo incluido. Ver `modelos/cuerpo.py` y la pantalla `#cuerpo`.
- [ ] **Va fluido en un móvil normal.** Se prueba en un teléfono con el cuerpo y dos prendas.
- [ ] **Una foto plana da una textura creíble.** Se prueba con una prenda lisa, una de tejido
  marcado y una con estampado grande.
- [ ] **Cargar el armario entero no cansa.** Se prueba cronometrando diez prendas seguidas.

Si el tercero falla con los estampados, la salida es mantener el cuerpo 3D y mostrar la prenda como
la foto recortada colocada delante del cuerpo, que es lo que ya hace la prueba actual en 2D.

## Alcance mínimo

Dentro:

- Dos cuerpos base, mujer y hombre, cada uno con pelo y dos controles: altura y complexión.
  (Cambiado el 14 de octubre de 2026: antes era un solo cuerpo con un control de hombros y cadera.)
- Dos prendas de catálogo: una camiseta y un pantalón.
- La captura que ya funciona (foto y recorte), más elegir el tipo de prenda y extraer su color.
- Armario guardado en el dispositivo, y vestir el maniquí eligiendo de él.
- Girar el maniquí con el dedo.

## Lo que no vamos a hacer, y por qué

- **Corte y caída exactos de cada prenda.** Es terreno de investigación; el catálogo de formas es el
  sustituto.
- **Cuentas y sincronización entre dispositivos.** Añade servidor y datos personales antes de saber
  si la app gusta.
- **Tarjeta en el portfolio.** No hace falta al principio.
- **Sugerencias automáticas de conjuntos.** Buena idea, pero no prueba nada del reto 3D.
- **Compartir con amigos y votar.** Para después.
- **Calzado, accesorios y abrigos.** Amplían el catálogo, que es lo más caro de producir.
- **Caras y tono de piel, y elegir peinado.** Cada cuerpo lleva un peinado fijo; el resto es neutro.

## Preguntas abiertas

- ¿Cuántas formas de prenda hacen falta? **Quince**, como objetivo; el alcance mínimo sigue siendo dos.
- ¿De dónde salen las prendas 3D? **Del catálogo libre de MakeHuman siempre que se pueda.**
  Comprobado el 14 de octubre de 2026 con un conjunto entero por cuerpo: siguen al cuerpo en los
  extremos de altura y complexión, porque MakeHuman reajusta la prenda a cada forma igual que el
  pelo. La tela ceñida deja asomar el cuerpo, y se resuelve como en MakeHuman: cada prenda dice qué
  parte del cuerpo tapa, y esa parte no se pinta. El paquete oficial libre (CC0) trae sobre
  todo conjuntos enteros (traje informal, deportivo, elegante) y zapatos, no prendas sueltas: habrá
  que separarlos o buscar prendas sueltas en el catálogo de la comunidad, mirando la licencia de cada una.
- ¿Foto por lotes? **No por ahora.** De una en una: cada foto es una prenda y una forma, y separar
  varias prendas de una foto no aporta nada al 3D.

## Otras direcciones que se valoraron

- **Cuerpo 3D con la foto como prenda.** Más barata y muestra la prenda real, pero al girar el
  maniquí la prenda es plana. Queda como salida si la textura sobre prendas 3D no convence.
- **Armario rápido primero y 3D después.** Útil antes, pero retrasa justo lo que se quiere ver
  funcionar.
