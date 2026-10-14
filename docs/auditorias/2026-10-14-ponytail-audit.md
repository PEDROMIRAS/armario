# Auditoría del repositorio (ponytail-audit)
Fecha: 2026-10-14 | Commit auditado: 01038ed

**Qué hace el repo:** Armario es una web para móvil. Haces una foto a una prenda, la web le quita el
fondo en el propio móvil y la coloca sobre una silueta en 2D. Aparte hay una pantalla de prueba con
un maniquí 3D de MakeHuman que se ajusta en altura y complexión. Se publica como sitio estático en
GitHub Pages.
**Carga supuesta:** una persona en su móvil. No hay servidor ni datos compartidos.

Se leyó todo el código y la configuración. Los 5 tests pasan, el build funciona y el lint da 4
avisos y ningún error.

## Conviene arreglar

1. **Las prendas se pierden al ir al 3D y volver** (`src/main.jsx:14`)
   - **Qué es:** `Pantalla` elige la pantalla según el `#` de la dirección.
   - **Problema:** al ir a `#cuerpo`, la pantalla de fotos se desmonta y pierde su estado. Pones una
     camiseta, pulsas «Probar el maniquí en 3D», vuelves y ya no está. Las direcciones `blob:` de las
     fotos nunca se liberan. El README dice que las prendas solo se pierden «al cerrar la página».
   - **Arreglo:** mantener montada la pantalla de fotos y solo ocultarla:
     `<><div hidden={ruta === '#cuerpo'}><App /></div>{ruta === '#cuerpo' && <Suspense><Cuerpo /></Suspense>}</>`.
     Si da igual perderlas, basta con corregir el README.
   - **Si no se arregla:** quien pruebe las dos pantallas pierde su ropa sin aviso, y la memoria se
     va llenando.

2. **Un error antiguo tapa un cuerpo bien cargado** (`src/Cuerpo.jsx:105`)
   - **Qué es:** al cambiar entre Mujer y Hombre se descarga el `.glb`. Las descargas viejas se
     marcan como `cancelado`.
   - **Problema:** la respuesta de error no comprueba `cancelado`. Con mala red: pulsas Hombre, falla
     tarde, mientras tanto cargas Mujer, y aparece «No se ha podido cargar el cuerpo.» encima de un
     cuerpo que sí se ve.
   - **Arreglo:** `() => { if (!cancelado) setEstado('No se ha podido cargar el cuerpo.'); }`.
   - **Si no se arregla:** salen errores falsos justo cuando la red va mal.

3. **La medida de la altura no tiene test** (`src/Cuerpo.jsx:16-20`)
   - **Qué es:** `extremoY` recorre las posiciones de los vértices (x, y, z) para sacar el punto más
     alto. De ahí salen los cm del control.
   - **Problema:** si `i = 1` pasara a `i = 0`, mediría la X. Las alturas saldrían falsas y ningún
     test fallaría.
   - **Arreglo:** mover `extremoY` a `src/formas.js` y añadir un test con 3 vértices en
     `formas.test.js`.
   - **Si no se arregla:** un error aquí solo se nota a ojo.

4. **El lint no se ejecuta en CI** (`.github/workflows/deploy.yml:27-28`)
   - **Qué es:** el workflow ejecuta los tests y el build antes de publicar.
   - **Problema:** `react/rules-of-hooks` es un error que rompe React, pero `oxlint` no se ejecuta
     antes de publicar.
   - **Arreglo:** añadir `- run: npm run lint` tras `npm ci`. Hoy solo da avisos, así que no
     bloquea nada.
   - **Si no se arregla:** el único control de ese fallo depende de acordarse de ejecutarlo.

## Mejoras menores

5. **Dos imports de `react`** (`src/main.jsx:1` y `:5`): juntarlos en una sola línea.
6. **`@types/react` y `@types/react-dom` sin uso:** el proyecto es JavaScript sin `tsconfig`.
   Se quitan con `npm remove @types/react @types/react-dom`.

**Veredicto:** está sano para una prueba. Primero el 1 y el 2, que son los que ve el usuario.
**Lean:** -1 línea, -2 dependencias posibles.
**No revisado:** rendimiento en un móvil real, el quitado de fondo en el navegador y
`modelos/cuerpo.py` (necesita Blender 5 con MPFB). Tampoco los `.glb` generados.
