# Armario

Aplicación web para móvil con la que fotografías tu ropa y combinas conjuntos sobre un maniquí,
sin tener que probártela.

**Estado: prueba inicial.** Ahora mismo hace una sola cosa: eliges o haces una foto de una prenda
(parte de arriba o parte de abajo), le quita el fondo y la coloca sobre una silueta. Todavía no
guarda las prendas: se pierden al cerrar la página.

Demo: <https://pedromiras.github.io/armario/>

## Cómo funciona

1. La foto se reduce a 1280 px de lado como máximo.
2. Un modelo de IA le quita el fondo **en el propio dispositivo**: la foto no se envía a ningún
   servidor. Lo único que se descarga, la primera vez, es el modelo (varias decenas de MB).
3. La prenda se recorta a su tamaño real y se coloca en su hueco del maniquí.

El código de esos pasos está en [src/recorte.js](src/recorte.js); la pantalla, en
[src/App.jsx](src/App.jsx).

## Plan

La idea completa, con lo que se va a comprobar y lo que queda fuera, está en
[docs/ideas/armario-virtual.md](docs/ideas/armario-virtual.md).

1. Captura y armario: guardar las prendas con su tipo y su color.
2. Conjuntar en 2D sobre el maniquí.
3. Maniquí 3D con tus medidas y prendas con la textura de tu ropa.

## Tecnología

- React 19 y Vite.
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
