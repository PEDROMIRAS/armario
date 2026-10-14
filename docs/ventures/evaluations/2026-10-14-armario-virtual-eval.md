# Evaluación de la idea: Armario virtual
Fecha: 2026-10-14 | Veredicto: ITERATE | Puntuación: 31/55

## Idea
Una app web para el móvil en la que fotografías tu ropa y montas conjuntos sobre un cuerpo 3D
ajustado al tuyo, sin probártela. Todo se guarda en el dispositivo, sin cuentas ni servidor.

## Segmento
Mujeres de 20 a 35 años con un armario grande que no saben qué ponerse cuando salen a una cena, una
fiesta o un evento.

## Qué hacen hoy
Se prueban cinco conjuntos delante del espejo y dejan la cama llena de ropa, mandan fotos a una
amiga por WhatsApp, buscan ideas en Pinterest o Instagram, usan apps como Whering, Cladwell o Indyx,
o acaban comprando algo nuevo.

Dos cosas cambian el enfoque:
- Ya hay apps de armario gratuitas y conocidas.
- El problema llega a ratos, solo antes de un evento. No es algo de todos los días.

## Tamaño (Fermi)
Objetivo del año 1: probar con amigas y que el proyecto pague sus costes. Hoy los costes son casi
cero: GitHub Pages es gratis y no hay servidor. El listón económico está casi cumplido de partida.

| Factor | Estimación | Razón |
|---|---|---|
| Usuarias alcanzables el año 1, sin presupuesto | 2.000 (300–5.000) | Amigas, sus amigas y algo de boca a boca |
| Siguen usándola al mes | 20 % → 400 | Retención típica de una app de consumo nueva |
| Pagarían algo | 5 % → 20 | Conversión habitual de un modelo gratis con extras de pago |
| Precio | 20 €/año | Por debajo de las apps de pago del sector |

SOM: ~400 €/año (rango 50–5.000 €). Factor más incierto: cuántas usuarias siguen usándola, porque
depende de que fotografíen su ropa.

Comprobación: es un ingreso de proyecto paralelo, no de negocio. Basta para cubrir un dominio o una
cuenta de desarrollador, pero no para pagar servidores si algún día hicieran falta.

## Puntuación (1–5)
| Dimensión | Nota | Evidencia o supuesto |
|---|---|---|
| Deseabilidad | 3 | _El problema existe, pero solo lo conocemos por pareja, hermanas y amigas. No hay entrevistas._ |
| Viabilidad | 3 | _Con coste casi cero, pagar costes es fácil. No hay modelo de cobro definido, y el código es público (AGPL), así que un muro de pago sería fácil de saltar._ |
| Viabilidad técnica | 3 | _La captura 2D ya funciona y los cuerpos 3D se deforman en el navegador. Faltan prendas 3D que sigan al cuerpo y una textura creíble sacada de una foto. Las dos cosas están sin probar._ |
| Canal de distribución | 3 | _Para la primera fase hay un canal concreto: el círculo de amigas. Más allá no hay ninguno definido._ |
| Por qué ahora | 3 | _Quitar el fondo con IA en el propio móvil, gratis y sin servidor, es viable desde hace poco. Eso permite una app privada y sin costes._ |
| Encaje del fundador | 2 | _Lo ves desde fuera, como desarrollador. Compensa que tienes acceso directo al segmento._ |
| Tamaño de mercado | 2 | _SOM de unos 400 €/año. Vale para el objetivo declarado, no para un negocio._ |
| Alternativas actuales | 2 | _Whering y similares son gratuitas y ya están asentadas. La ventaja propia (cuerpo 3D parecido al tuyo, privacidad) no está probada._ |
| Defendibilidad | 1 | _Código abierto, datos solo en el móvil, sin efecto red. Nada se acumula con el tiempo._ |
| Intensidad de capital | 5 | _Coste casi cero para llegar al primer euro._ |
| Riesgo legal o ético | 4 | _Las fotos no salen del móvil. MakeHuman es CC0. La AGPL se cumple con el repositorio público._ |

## Supuestos críticos sin validar
1. **Fotografiarán bastante ropa.** El esfuerzo de meter el armario en la app es el freno conocido
   de este tipo de apps, y aquí cada prenda es una foto.
2. **Ver el conjunto en un maniquí ayuda a decidir mejor que el espejo o WhatsApp.** La decisión
   tiene mucho de "cómo me queda a mí" y de la opinión de una amiga.
3. **Abrirán la app justo antes del evento.** Ese momento llega de vez en cuando, y la app tiene que
   estar ya llena de ropa para servir.
4. **Una foto plana da una textura creíble en 3D.** Ya figura como supuesto pendiente en
   `docs/ideas/armario-virtual.md`.
5. **El cuerpo 3D y la privacidad pesan más que lo que ya ofrecen las apps gratuitas.**

## Antipatrones detectados
- **Validación con amigas y familia.** Lo que digan pareja, hermanas o amigas cuenta poco como prueba
  de demanda. Ellas sí están en el segmento, pero el sesgo es alto. *Respuesta pendiente: usar
  amigas de amigas en el test.*
- **"El cobro ya lo veremos".** Es aceptable aquí, porque el objetivo no es facturar y el coste es
  casi cero. Pasa a ser un problema si el proyecto crece y necesita servidor.

## Veredicto
**ITERATE.** No salta ningún motivo de descarte: hay problema, segmento, canal inicial y coste casi
nulo. Pero cuatro dimensiones sacan 2 o menos y la puntuación (31) queda por debajo de 33. Como
negocio estaría cerca de KILL. Como proyecto paralelo para probar con amigas tiene sentido seguir,
siempre que antes se compruebe el supuesto 1.

## Criterios para descartarla (90 días)
- Si menos de 3 de 8 probadoras la usan por iniciativa propia antes de un evento real, se descarta
  o se cambia el enfoque.
- Si la mediana de prendas que mete cada probadora es menor que 10, se descarta el flujo de "armario
  completo".

## Siguiente test para intentar tumbarla
- **Supuesto:** fotografiarán bastante ropa, y la app les ayuda a decidir antes de un evento (1 + 2).
- **Método:** entrevistas al estilo Mom Test, que preguntan por lo que hicieron la última vez en
  lugar de por opiniones. 6 mujeres del segmento, al menos 3 que no sean amigas cercanas. Preguntas
  clave:
  - La última vez que no sabías qué ponerte, ¿qué hiciste paso a paso?
  - ¿Has probado alguna app de armario? ¿Cuántas prendas metiste y por qué la dejaste?
- **Coste:** 0 € | **Plazo:** 14 días | **Responsable:** Pedro
- **Éxito:** al menos 4 de 6 cuentan el problema sin que se lo sugieras como algo que se repite, y
  al menos 3 de 6 dicen que fotografiarían 15 prendas o más.
- **Descarte:** menos de 3 de 6 lo cuentan sin sugerencia, o la mayoría dejó una app de armario por
  la pereza de meter la ropa.
- **Si sale KILL:** cambiar a un flujo sin catálogo. Antes del evento se fotografían solo las 3–5
  prendas candidatas y se comparan en el maniquí. Ese flujo resuelve el momento del evento sin
  tener que meter el armario entero.
- La skill indicada es `customer-discovery`.

## Decisión del fundador
Ninguna por ahora.
