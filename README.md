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
   prenda 3D a su tamaño real, como un rollo de tela: la prenda extendida en la foto mide la mitad de
   su contorno, y la tela se mide sobre el contorno de la prenda 3D a cada altura, para que no se
   apriete en el frente ni se estire en los costados. Así se ven el color, el tejido y el estampado
   reales sobre la forma de la prenda del catálogo; lo que se pierde es un dibujo grande en su sitio,
   como un logo en el pecho.

El código está en [src/recorte.js](src/recorte.js) (pasos 1 a 3) y [src/textura.js](src/textura.js)
(paso 4); la pantalla, en [src/App.jsx](src/App.jsx).

## El cuerpo 3D

Los cuerpos, el pelo y la ropa son de [MakeHuman](http://www.makehumancommunity.org/). Los genera
[modelos/cuerpo.py](modelos/cuerpo.py): crea cada cuerpo base con su piel, ojos, cejas, pestañas,
peinado y zapatos, le baja los brazos y relaja las manos (MakeHuman lo crea con los brazos abiertos)
y guarda como formas sus cuatro extremos (delgado, corpulento, bajo y alto). La app mezcla esas
formas según los controles, y el pelo y las prendas llevan las mismas para seguir al cuerpo.

- `public/modelos/mujer.glb` (3,3 MB) y `hombre.glb` (2,7 MB): el cuerpo, sin ropa.
- `public/modelos/mujer.json` y `hombre.json`: el catálogo de formas de prenda de cada cuerpo (15 de
  mujer y 5 de hombre), con su hueco y su nombre en la app.
- `public/modelos/mujer/<prenda>.glb` (de 100 KB a 1 MB): cada forma, que la app descarga solo cuando
  te la pones, y `<prenda>.png`, la máscara de la piel que tapa. La app junta las máscaras de lo que
  llevas y no pinta esa piel: así no asoma por la tela ceñida. Cada vértice de la prenda lleva, como
  coordenadas de textura, las del punto de la piel que tiene debajo, y la máscara de una parte de
  arriba trae en verde la piel que cubre mirada píxel a píxel: la parte de arriba va siempre por fuera,
  y lo que tapa del pantalón o la falda no se pinta, para que la cinturilla no la atraviese.

Para regenerarlos hace falta [Blender](https://www.blender.org/) 5 con la extensión MPFB y los
paquetes de recursos de MakeHuman descomprimidos en una misma carpeta: el de sistema
([makehuman_system_assets_cc0.zip](https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip),
280 MB) y los de ropa de la [lista de paquetes](https://static.makehumancommunity.org/assets/assetpacks.html):
Dress 01, 02 y 03, Shirts 01, 02 y 03, Pants 01 y 02, Skirts 01 y 02 y Shoes 01. Las cuadrículas con
las prendas que se valoraron están en [docs/pruebas/prendas/](docs/pruebas/prendas/).

```bash
MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
```

El maniquí está en [src/Cuerpo.jsx](src/Cuerpo.jsx). Está de pie en un dormitorio (suelo
de tablas, una ventana con cortinas, una cama, una mesilla con lámpara, una planta, un cuadro, una
alfombra y un armario abierto), hecho con piezas de three.js en
[src/habitacion.js](src/habitacion.js): no se descarga nada y se edita sin Blender. La lámpara da
luz cálida a su alrededor, pero no llega al maniquí, para no cambiar el color de la ropa.

La luz sale de una foto 360° de una habitación real, `public/luz.hdr` (430 KB): «Poly Haven
Studio», de [Poly Haven](https://polyhaven.com/a/poly_haven_studio) (CC0), reducida a 512 px y sin
su tinte, para que la ropa se vea de su color. Un foco proyecta las sombras del cuerpo en el suelo y
de la ropa sobre sí misma. La tela lleva el brillo suave de los tejidos y el relieve de la trama,
sacado de la propia foto.

La cámara se queda quieta delante; al arrastrar gira el maniquí, como al darte la vuelta delante
de un espejo.

## Plan

La idea completa, con lo que se va a comprobar y lo que queda fuera, está en
[docs/ideas/armario-virtual.md](docs/ideas/armario-virtual.md).

1. El armario que se llena solo, sobre el maniquí 3D: hecho, falta probarlo con gente.
2. La tijera: recortar el bajo de cada prenda con controles, en vez de añadir más formas.
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

Las prendas de MakeHuman son CC0, salvo estas, que son CC-BY y se usan citando a su autor:
Elvaerwyn (`elvs_jeans_straight_leg`, `elvs_gored_elephant_pants`, `elvs_pencil_skirt`,
`elvs_simple_fashion_dress_1`, `elvs_male_shirt_untucked_bd1`), Mindfront
(`mindfront_knitted_sweater_01` y `02`, `mindfront_female_trousers_1`, `mindfront_male_trousers_2`,
`mindfront_f_dress_06`) y punkduck (`punkduck_v_neck_top`, `punkduck_off-shoulder_long-sleeve_top`,
`punkduck_female_tight_jeans`, `punkduck_male_classic_jeans`, `punkduck_retro_polka_dot_skirt`,
`punkduck_black_mini_skirt`, `punkduck_black_cocktail_dress`). Todas en el
[repositorio de recursos de MakeHuman](http://www.makehumancommunity.org/content/user_contributed_assets.html).

La librería que quita el fondo tiene licencia AGPL-3.0, que obliga a publicar el código de las
aplicaciones que la usan. Este repositorio es público por ese motivo.
