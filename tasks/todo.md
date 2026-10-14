# Tareas: prendas 3D que siguen al cuerpo

Plan completo en `tasks/plan.md`.

## Tarea 1: una prenda de MakeHuman sigue al cuerpo de mujer

**Descripción:** Prueba. `modelos/cuerpo.py` añade al cuerpo de mujer una prenda del paquete CC0
(vale un conjunto entero), con las mismas cuatro formas que el cuerpo y el pelo, y la exporta dentro
de `mujer.glb`. La pantalla `#cuerpo` la muestra con un color fijo.

**Criterios de aceptación:**
- [x] `mujer.glb` trae una malla de prenda con las formas `delgado`, `corpulento`, `bajo` y `alto`
      (también `hombre.glb`)
- [x] En `#cuerpo`, la prenda se mueve con los controles de altura y complexión (Pedro lo vio en el
      navegador, en los dos cuerpos)
- [x] Queda anotado en `docs/ideas/armario-virtual.md` si sigue al cuerpo y dónde falla, si falla

**Verificación:**
- [x] El modelo se genera: `MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py`
      termina con `CUERPO_OK` para los dos cuerpos
- [x] `npm test` y `npm run build` pasan
- [x] A mano, en `npm run dev`: Pedro lo vio en los dos cuerpos. Los extremos de los controles están
      comprobados con imágenes generadas en Blender a partir de los `.glb`
- [x] Peso anotado: `mujer.glb` 2,9 MB (antes 2,4) y `hombre.glb` 3,6 MB (antes 2,3), ya con los
      brazos bajados

**Pendiente, de la revisión (no afecta a los conjuntos actuales):**
- `modelos/cuerpo.py` espera un solo conjunto por cuerpo, en dos piezas sueltas y que tape cuerpo;
  con otro tipo de prenda falla al generar
- La altura se mide solo en la piel que nunca se tapa; una prenda que tape la cabeza la falsearía

**Dependencias:** ninguna

**Archivos:**
- `modelos/cuerpo.py`
- `src/Cuerpo.jsx` (material de la prenda: hoy toda malla que no es `cuerpo` se trata como pelo)
- `public/modelos/mujer.glb`
- `docs/ideas/armario-virtual.md`

**Tamaño:** M

## Punto de control: ¿siguen al cuerpo?

- [x] La prenda acompaña a los dos controles en todo su recorrido
- [x] Decisión con Pedro: fase 2

## Tarea 2: camiseta y pantalón sueltos en los dos cuerpos

**Descripción:** Sustituye la prenda de la prueba por una camiseta y un pantalón como mallas
separadas, en `mujer.glb` y `hombre.glb`. Salen de separar un conjunto del paquete CC0 o del
catálogo de la comunidad, con la licencia de cada una anotada en el README.

**Criterios de aceptación:**
- [x] Cada `.glb` trae dos mallas, `camiseta` y `pantalon`, con las cuatro formas
- [x] El cuerpo no asoma por ninguna de las dos en los extremos de los controles (en imágenes de
      Blender; en la cintura del pantalón de mujer queda algún pico de piel de pocos milímetros)
- [x] El README dice de dónde sale cada prenda y con qué licencia

**Verificación:**
- [x] El modelo se genera con `CUERPO_OK` para los dos cuerpos
- [x] `npm test` y `npm run build` pasan
- [ ] A mano: los dos cuerpos, con los controles en sus extremos, girando
- [x] Peso anotado: `mujer.glb` 2,9 MB y `hombre.glb` 2,7 MB

**Dependencias:** tarea 1 y su punto de control

**Archivos:**
- `modelos/cuerpo.py`
- `public/modelos/mujer.glb`, `public/modelos/hombre.glb`
- `README.md`

**Tamaño:** M

## Tarea 3: poner y quitar cada prenda en la pantalla del maniquí

**Descripción:** Dos botones en `#cuerpo`, uno por prenda, que la ponen o la quitan. Es el primer
"vestir el maniquí"; elegir del armario guardado llega con el plan del armario.

**Criterios de aceptación:**
Hecho en el código; falta verlo en un navegador.

- [ ] Cada prenda se pone y se quita con su botón, y el botón dice su estado (`aria-pressed`)
- [ ] La elección se mantiene al cambiar entre mujer y hombre
- [ ] Con las dos prendas quitadas se ve el cuerpo como hoy

**Verificación:**
- [x] `npm test` y `npm run build` pasan
- [ ] A mano: las cuatro combinaciones en los dos cuerpos, con teclado además de con el dedo

**Dependencias:** tarea 2

**Archivos:**
- `src/Cuerpo.jsx`
- `src/Cuerpo.css`

**Tamaño:** S

## Punto de control: maniquí vestido

- [ ] `npm test` y `npm run build` pasan
- [ ] En un móvil, girar y mover los controles con las dos prendas va fluido
- [ ] README y documento de la idea actualizados con lo comprobado
