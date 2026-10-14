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

- **Maniquí 3D** (`src/Cuerpo.jsx`): cuerpos de mujer y hombre de MakeHuman (CC0) con altura y
  complexión. Los `.glb` de `public/modelos/` los genera `modelos/cuerpo.py` con Blender 5 y MPFB,
  que **solo están en el sobremesa**.
- **Prendas**: la foto se recorta en el móvil con IA (`src/recorte.js`). Se toma un trozo de tela
  uniforme, se le quita la luz de la foto y se envuelve con él una prenda 3D del catálogo:
  camiseta o pantalón (`src/textura.js`). No se usa la foto entera: su forma nunca coincide.
- **Armario y conjuntos**: se guardan en el móvil, en IndexedDB (`src/almacen.js`).
- **Huecos** (`src/huecos.js`): arriba, abajo y vestido. Un botón solo aparece si el `.glb` trae su
  malla. El vestido aún no tiene malla.

## Siguiente

En el sobremesa: [el vestido 3D](docs/planes/2026-10-14-vestido-3d.md), en su versión más larga.
Después, **la tijera** en vez de más mallas: el shader recorta el bajo y la manga, y así salen el
mini, el midi y el largo de una sola malla. Luego tono de piel y pelo, la habitación fija (armario
con perchas, unas 15 h como máximo) y la prueba con 3 amigas. Orden y motivos en
[la idea](docs/ideas/armario-virtual.md). El público son mujeres de 20 a 35 años que no saben qué
ponerse para una cena o un evento, y casi todo lo que prueban son vestidos.

## Decisiones que no hay que repetir

- **Leer el enlace de la tienda: descartado.** Zara, Shein, Mango, H&M y Temu lo bloquean
  ([prueba](docs/pruebas/2026-10-14-enlaces-de-tienda.md)). Se usan capturas o la imagen guardada.
- **Fotos de tienda con modelo:** el recorte deja a la persona entera. El trozo de tela la esquiva,
  pero lo mejor sigue siendo la foto de la prenda sola.
- **Silueta 2D: quitada.** Solo 3D, por decisión de Pedro.
- **Probador con IA generativa: descartado.** Cuesta dinero y saca las fotos del móvil.
- **Más mallas de prenda (blusa, falda, top…): no.** Lo que no salga de recortar camiseta, pantalón
  o vestido con la tijera, no se hace. Tampoco pecho, cintura y cadera en el maniquí, por el peso.

## Documentos

- `docs/ideas/armario-virtual.md`: la idea, los supuestos por comprobar y lo que no se hace.
- `docs/ventures/evaluations/`: evaluación de la idea (ITERATE) y las entrevistas pendientes.
- `docs/planes/`: planes de trabajo. `docs/pruebas/`: pruebas técnicas y su resultado.
- `docs/auditorias/`: auditorías del código.
- `docs/entorno/skills.md`: cómo instalar en cada PC las skills globales (ponytail, graphify,
  agent-skills de addyosmani, agent-loom, find-skills). Las del proyecto, como `caveman-compress`,
  están en `.claude/skills/` y llegan con git.
- `graphify-out/` no se sube: se regenera con `/graphify .` y se queda viejo enseguida.
