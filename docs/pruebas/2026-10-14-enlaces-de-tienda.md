# Prueba: ¿se puede leer la prenda desde el enlace de la tienda?
Fecha: 2026-10-14 | Resultado: **no, sin saltarse las protecciones de las tiendas**

## Qué se probó
Pedir la página de la tienda desde un servidor, como lo haría un intermediario (Cloudflare Worker),
con la identificación de un Safari de iPhone, y buscar la imagen que la tienda publica para
compartir en redes (`og:image`).

## Resultado
| Tienda | Qué devuelve | Lectura |
|---|---|---|
| Zara | Página de 2 KB con un reto en JavaScript de Akamai (`bm-verify`) | Bloqueada |
| Bershka | Igual que Zara (Inditex) | Bloqueada |
| Shein | La portada sí; las fichas de producto redirigen a un captcha (`/risk/challenge`) | Bloqueada |
| Temu | Página de 3 KB sin contenido | Bloqueada |
| Mango | 403 (prohibido) | Bloqueada |
| H&M | 403 (prohibido) | Bloqueada |

## Qué significa
- Leer el enlace exigiría saltarse esas protecciones: navegadores automatizados, resolver captchas o
  hacerse pasar por el robot de vista previa de WhatsApp o Facebook. Es frágil, se rompe cuando la
  tienda cambia algo y va contra sus condiciones de uso. **Se descarta.**
- Desde el propio móvil tampoco se puede: el navegador no deja que una web lea otra (CORS).

## Alternativas sin servidor
1. **Captura de pantalla de la tienda.** Funciona hoy con la pantalla de fotos y en cualquier móvil.
   Hay que recortar la prenda de la captura. Si la foto lleva modelo, quitar a la persona es más
   difícil que quitar el fondo.
2. **Compartir la imagen desde la app de la tienda** (mantener pulsada la foto y pulsar «Compartir»).
   La web puede recibirla con Web Share Target si está instalada en la pantalla de inicio. Solo
   funciona en Android: Safari de iPhone no lo admite.
3. **Programa de afiliados de Shein** (para la fase B). Puede dar acceso oficial a los productos.
   Falta comprobar qué ofrece y con qué condiciones.

## Siguiente paso
Probar a mano la alternativa 1 con 5 capturas reales de Zara y Shein, y ver qué deja el recorte
actual: con modelo, sin modelo y en «flat lay» (la prenda extendida sobre una superficie).
