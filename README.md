# Armario

Aplicación web para móvil con la que fotografías tu ropa y combinas conjuntos sobre un maniquí,
sin tener que probártela.

**Estado: pruebas iniciales.** Una sola pantalla con un maniquí 3D: eliges cuerpo de mujer o de
hombre, lo ajustas en altura y complexión y lo giras arrastrando. Le pones ropa con fotos: eliges o
haces una foto de una parte de arriba o de abajo, la app le quita el fondo y la pone como tela de la
camiseta o del pantalón 3D. Cada prenda queda guardada en el propio móvil, en «Tu armario», para
volver a ponértela o borrarla, y lo que llevas se puede guardar como conjunto con el nombre de la
ocasión («Cena de Laura») para volver a él con un toque. Safari puede borrar lo guardado si pasas
semanas sin abrir la web, salvo que la añadas a la pantalla de inicio.

Demo: <https://pedromiras.github.io/armario/>

## Cómo funciona

1. La foto se reduce a 1280 px de lado como máximo.
2. Un modelo de IA le quita el fondo **en el propio dispositivo**: la foto no se envía a ningún
   servidor. Lo único que se descarga, la primera vez, es el modelo (varias decenas de MB).
3. La prenda se recorta a su tamaño real y se mide el ancho de su cuerpo (el bajo de una camiseta,
   la cintura de un pantalón).
4. De la foto se toma un trozo de tela limpio y uniforme, sin costuras ni botones, y se le quita la
   luz con la que se hizo la foto (pliegues, sombras, brillos). Ese trozo se repite alrededor de la
   prenda 3D a su tamaño real, como un rollo de tela. Así se ven el color, el tejido y el estampado
   reales sobre la forma de la prenda del catálogo; lo que se pierde es un dibujo grande en su sitio,
   como un logo en el pecho.

El código está en [src/recorte.js](src/recorte.js) (pasos 1 a 3) y [src/textura.js](src/textura.js)
(paso 4); la pantalla, en [src/App.jsx](src/App.jsx).

## El cuerpo 3D

Los cuerpos, el pelo y la ropa son de [MakeHuman](http://www.makehumancommunity.org/), de licencia
CC0. Están en `public/modelos/mujer.glb` (3,3 MB) y `hombre.glb` (2,9 MB), y los genera
[modelos/cuerpo.py](modelos/cuerpo.py): crea cada cuerpo base con su peinado y un conjunto de ropa,
le baja los brazos (MakeHuman lo crea con ellos abiertos) y guarda como formas sus cuatro extremos
(delgado, corpulento, bajo y alto). La app mezcla esas formas según los controles, y el pelo y las
prendas llevan las mismas para seguir al cuerpo.

Las prendas salen de los conjuntos `female_casualsuit01` y `male_casualsuit04` del paquete, que
vienen en dos piezas sueltas: el generador las separa en `camiseta` y `pantalon`. La parte del
cuerpo que queda bajo cada prenda va en el archivo como pieza aparte y la app no la pinta mientras
la prenda está puesta: así el cuerpo no asoma por la tela ceñida.

El cuerpo de mujer lleva además un vestido: la túnica `wdg_mycenaean_tunic` (de WDG, CC0) del
paquete Dress 01, recta, por debajo de la rodilla y con manga corta.

Para regenerarlos hace falta [Blender](https://www.blender.org/) 5 con la extensión MPFB y los
paquetes de recursos libres de MakeHuman
([makehuman_system_assets_cc0.zip](https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip),
280 MB, y [dress01_cc0.zip](https://files.makehumancommunity.org/asset_packs/dress01/dress01_cc0.zip),
44 MB) descomprimidos en la misma carpeta:

```bash
MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
```

El maniquí está en [src/Cuerpo.jsx](src/Cuerpo.jsx).

## Plan

La idea completa, con lo que se va a comprobar y lo que queda fuera, está en
[docs/ideas/armario-virtual.md](docs/ideas/armario-virtual.md).

1. El armario que se llena solo, sobre el maniquí 3D: hecho, falta probarlo con gente.
2. La tijera: recortar el bajo y la manga de cada prenda con controles, en vez de añadir más formas.
3. ¿Me lo compro?: ver una prenda de una tienda combinada con las que ya tienes.

## Tecnología

- React 19 y Vite.
- [three.js](https://threejs.org/) para el maniquí 3D.
- [@imgly/background-removal](https://github.com/imgly/background-removal-js) para quitar el fondo
  en el navegador.
- Publicación en GitHub Pages con GitHub Actions en cada cambio de `main`.

## Uso en local

```bash
npm install
npm run dev     # servidor de desarrollo
npm test        # tests del recorte, la proyección de la foto y las formas
npm run build   # versión de producción en dist/
```

## Licencia

La librería que quita el fondo tiene licencia AGPL-3.0, que obliga a publicar el código de las
aplicaciones que la usan. Este repositorio es público por ese motivo.
