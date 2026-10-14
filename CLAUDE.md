# Armario

Web para móvil: fotografías tu ropa y la combinas sobre un maniquí 3D ajustable, sin probártela.
Proyecto paralelo de Pedro, de 5 a 10 horas a la semana. Objetivo: probarlo con amigas y que pague
sus costes. Demo: <https://pedromiras.github.io/armario/>

## Cómo trabajar aquí

- Todo en español: conversación, código (nombres y comentarios), commits y documentación.
- Toda la documentación va en `docs/`, en Markdown, y se sube. Pedro trabaja en dos PCs (portátil y
  sobremesa) y lo que no está en git no existe en el otro.
- Se trabaja en `main` y se sube al terminar cada paso: cada push publica la demo en GitHub Pages.
- Antes de dar algo por hecho: `npm test`, `npm run build` y verlo funcionar en un navegador. Con
  el 3D, mirarlo de frente, de lado y de espaldas.
- Sin servidor, sin cuentas y sin coste: las fotos no salen del móvil. Cualquier idea que lo rompa
  se consulta antes.

## Estado (14 de octubre de 2026)

Una sola pantalla (`src/App.jsx`):

- **Habitación** (`src/habitacion.js`, piezas de three.js, sin Blender): un dormitorio fijo, con un armario abierto aún sin
  perchas. Al arrastrar gira el maniquí, no la cámara. Las medidas se piden una vez al entrar.
- **Maniquí 3D** (`src/Cuerpo.jsx`): cuerpos de mujer y hombre de MakeHuman (CC0) con altura y
  complexión. Los `.glb` de `public/modelos/` los genera `modelos/cuerpo.py` con Blender 5 y MPFB,
  que **solo están en el sobremesa**.
- **Prendas**: la foto se recorta en el móvil con IA (`src/recorte.js`). Se toma un trozo de tela
  uniforme, se le quita la luz de la foto y se envuelve con él una forma 3D del catálogo, con su
  relieve (`src/textura.js`). No se usa la foto entera: su forma nunca coincide.
- **Catálogo**: 15 formas de mujer y 5 de hombre (camiseta, blusa, vaqueros, falda de tubo, vestido de
  cóctel…), de los paquetes de ropa de MakeHuman. Cada una en su `.glb` con la máscara de la piel que
  tapa, y la lista en `public/modelos/mujer.json`. La forma se elige en «Añadir prenda». La parte de
  arriba va siempre por fuera: lo que tapa del pantalón o la falda no se pinta.
- **Luz**: una foto 360° neutra (`public/luz.hdr`), sombras del foco y tela con brillo de tejido.
- **Armario y conjuntos**: se guardan en el móvil, en IndexedDB (`src/almacen.js`).
- **Huecos** (`src/huecos.js`): arriba, abajo y vestido. Solo se ofrece un hueco si el cuerpo tiene
  alguna forma suya: el hombre no tiene vestidos.

## Siguiente

Ver en el navegador el catálogo, la luz y las sombras con fotos reales. Después, lo que queda para
el realismo: simular la caída de la tela en Blender (probar primero con una prenda: puede temblar al
mezclar las formas del cuerpo), las perchas del armario y la prueba con 3 amigas. Motivos en
[la idea](docs/ideas/armario-virtual.md). El público son mujeres de 20 a 35 años que no saben qué
ponerse para una cena o un evento, y casi todo lo que prueban son vestidos.

## Decisiones que no hay que repetir

- **Leer el enlace de la tienda: descartado.** Zara, Shein, Mango, H&M y Temu lo bloquean
  ([prueba](docs/pruebas/2026-10-14-enlaces-de-tienda.md)). Se usan capturas o la imagen guardada.
- **Fotos de tienda con modelo:** el recorte deja a la persona entera. El trozo de tela la esquiva,
  pero lo mejor sigue siendo la foto de la prenda sola.
- **Silueta 2D: quitada.** Solo 3D, por decisión de Pedro.
- **Probador con IA generativa: descartado.** Cuesta dinero y saca las fotos del móvil.
- **Cortes reales antes que la tijera** (14 de octubre de 2026, por la noche). Pedro quiere las prendas
  lo más realistas posible: un catálogo de formas de MakeHuman en vez de recortar una sola. La tijera
  queda aparcada. Pecho, cintura y cadera en el maniquí, aún no.

## Documentos

- `docs/ideas/armario-virtual.md`: la idea, los supuestos por comprobar y lo que no se hace.
- `docs/ventures/evaluations/`: evaluación de la idea (ITERATE) y las entrevistas pendientes.
- `docs/planes/`: planes de trabajo. `docs/pruebas/`: pruebas técnicas y su resultado.
- `docs/auditorias/`: auditorías del código.
- `docs/entorno/skills.md`: cómo instalar en cada PC las skills globales (ponytail, graphify,
  agent-skills de addyosmani, agent-loom, find-skills). Las del proyecto, como `caveman-compress`,
  están en `.claude/skills/` y llegan con git.
- `graphify-out/` no se sube: se regenera con `/graphify .` y se queda viejo enseguida.
