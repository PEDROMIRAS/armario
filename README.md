# Armario

Aplicación web para móvil con la que fotografías tu ropa y combinas conjuntos sobre un maniquí,
sin tener que probártela.

**Estado: pruebas iniciales.** Hay dos pantallas sueltas, todavía sin unir:

- **Fotos**: eliges o haces una foto de una prenda (parte de arriba o parte de abajo), le quita el
  fondo y la coloca sobre una silueta. No guarda las prendas: se pierden al cerrar la página.
- **Maniquí 3D** (`#cuerpo`): eliges cuerpo de mujer o de hombre, cada uno con pelo, lo ajustas en
  altura y complexión, y lo giras arrastrando.

Demo: <https://pedromiras.github.io/armario/>

## Cómo funciona

1. La foto se reduce a 1280 px de lado como máximo.
2. Un modelo de IA le quita el fondo **en el propio dispositivo**: la foto no se envía a ningún
   servidor. Lo único que se descarga, la primera vez, es el modelo (varias decenas de MB).
3. La prenda se recorta a su tamaño real y se coloca en su hueco del maniquí.

El código de esos pasos está en [src/recorte.js](src/recorte.js); la pantalla, en
[src/App.jsx](src/App.jsx).

## El cuerpo 3D

Los cuerpos y el pelo son de [MakeHuman](http://www.makehumancommunity.org/), de licencia CC0.
Están en `public/modelos/mujer.glb` y `hombre.glb`, y los genera
[modelos/cuerpo.py](modelos/cuerpo.py): crea cada cuerpo base con su peinado y guarda como formas
sus cuatro extremos (delgado, corpulento, bajo y alto). La app mezcla esas formas según los
controles, y el pelo lleva las mismas para seguir al cuerpo.

Para regenerarlos hace falta [Blender](https://www.blender.org/) 5 con la extensión MPFB y el
paquete de recursos libres de MakeHuman
([makehuman_system_assets_cc0.zip](https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip),
280 MB) descomprimido:

```bash
MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
```

La pantalla está en [src/Cuerpo.jsx](src/Cuerpo.jsx).

## Plan

La idea completa, con lo que se va a comprobar y lo que queda fuera, está en
[docs/ideas/armario-virtual.md](docs/ideas/armario-virtual.md).

1. El armario que se llena solo: añadir prendas por foto o por enlace de tienda al usarlas,
   guardarlas en el dispositivo y guardar los conjuntos que te pones.
2. ¿Me lo compro?: ver una prenda de una tienda combinada con las que ya tienes.
3. Más adelante, prendas 3D sobre el maniquí 3D.

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
npm test        # tests de la lógica de recorte
npm run build   # versión de producción en dist/
```

## Licencia

La librería que quita el fondo tiene licencia AGPL-3.0, que obliga a publicar el código de las
aplicaciones que la usan. Este repositorio es público por ese motivo.
