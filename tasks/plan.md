# Plan: prendas 3D que siguen al cuerpo

> **14 de octubre de 2026, tarde:** las tareas 2 y 3 se hicieron de otra forma. La app es ahora solo
> 3D y las prendas se ponen desde el armario con la foto como tela (`src/textura.js`), no con botones
> de color fijo. **Siguiente tarea para este PC: [el vestido 3D](../docs/planes/2026-10-14-vestido-3d.md).**

## Resumen

El siguiente paso es vestir el maniquí 3D con una camiseta y un pantalón de MakeHuman que se
deformen con la altura y la complexión, igual que ya hace el pelo. Es lo más arriesgado del alcance
mínimo y lo que la idea quiere ver funcionar, así que va antes que guardar el armario: si falla,
cambia qué hay que guardar (una foto recortada en vez de un color y un tipo de prenda).

## Decisiones

- **Primero una prueba con una sola prenda y un solo cuerpo.** Responde a la pregunta abierta de
  `docs/ideas/armario-virtual.md` ("¿siguen al cuerpo al cambiar sus formas?") antes de invertir en
  separar conjuntos o buscar más prendas.
- **Mismo mecanismo que el pelo.** `modelos/cuerpo.py` ya carga un `.mhclo`, lo ajusta al cuerpo y
  le copia las cuatro formas. La prenda entra por ese camino; no se escribe otro distinto.
- **Las prendas van dentro del `.glb` de cada cuerpo.** `src/Cuerpo.jsx` ya aplica las formas a
  todas las mallas del archivo, así que la prenda las recibe sin código nuevo. Se separan en
  archivos propios solo si el peso lo pide.
- **Sin color de la foto todavía.** La prenda sale con un color fijo. Tomar el color y el tejido de
  la foto es el supuesto siguiente y tiene su propio plan.

## Dependencias

```
Paquete de MakeHuman (qué prendas trae, con qué licencia)
    └── modelos/cuerpo.py: prenda ajustada + cuatro formas   (tarea 1)
            ├── mujer.glb con una prenda → se ve en #cuerpo  (tarea 1)
            ├── camiseta y pantalón sueltos, dos cuerpos     (tarea 2)
            │       └── poner y quitar cada prenda           (tarea 3)
            └── el cuerpo no asoma por la tela               (tarea 2)
```

## Tareas

### Fase 1: la prueba

- [x] Tarea 1: una prenda de MakeHuman sigue al cuerpo de mujer

### Punto de control: ¿siguen al cuerpo?

- [x] La prenda acompaña a los dos controles en todo su recorrido, sin que el cuerpo la atraviese
- [x] Decisión con Pedro: seguir con la fase 2

### Fase 2: el alcance mínimo de prendas

- [ ] Tarea 2: camiseta y pantalón sueltos en los dos cuerpos
- [ ] Tarea 3: poner y quitar cada prenda en la pantalla del maniquí

### Punto de control: maniquí vestido

- [ ] `npm test` y `npm run build` pasan
- [ ] En un móvil, girar y mover los controles con las dos prendas va fluido (segundo supuesto de
      la idea)
- [ ] README y documento de la idea actualizados con lo comprobado

El detalle de cada tarea está en `tasks/todo.md`.

## Riesgos

| Riesgo | Impacto | Qué se hace |
|--------|---------|-------------|
| La prenda no sigue bien las formas extremas o el cuerpo la atraviesa | Alto | Se ve en la tarea 1. Si no tiene arreglo, se pasa a la salida prevista y no se hace la fase 2 |
| El paquete CC0 solo trae conjuntos enteros, no prendas sueltas | Medio | La tarea 1 usa un conjunto entero, que basta para la prueba. La tarea 2 lo separa o busca prendas sueltas en el catálogo de la comunidad, mirando la licencia de cada una |
| El `.glb` crece demasiado para un móvil (hoy 2,4 MB por cuerpo) | Medio | Se mide en cada tarea. Si pasa de unos 5 MB, las prendas van a archivos propios que se cargan al ponerlas |
| Blender con MPFB o el paquete de recursos ya no están en este equipo | Bajo | Se comprueba al empezar la tarea 1; el README dice cómo reinstalarlos |

## Preguntas abiertas

- ¿Qué prendas sueltas hay con licencia válida? Se responde en la tarea 2, con el paquete delante.
- ¿Las prendas de mujer y de hombre son la misma malla o dos distintas? MakeHuman ajusta cada prenda
  a cada cuerpo, así que debería valer la misma; se confirma en la tarea 2.
