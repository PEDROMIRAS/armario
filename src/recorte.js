// Foto de una prenda -> la misma prenda sin fondo y recortada a su tamaño.
// La foto no sale del dispositivo; lo único que se descarga (una vez) es el modelo que quita el fondo.

const LADO_MAXIMO = 1280; // las fotos del móvil son mucho mayores de lo que hace falta y tardan más

/**
 * Rectángulo que contiene todos los píxeles visibles de una imagen RGBA.
 * @returns {{x: number, y: number, ancho: number, alto: number}|null} null si es todo transparente.
 */
export function caja(pixeles, ancho, alto, umbral = 16) {
    let x0 = ancho, y0 = alto, x1 = -1, y1 = -1;
    for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
            if (pixeles[(y * ancho + x) * 4 + 3] <= umbral) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
        }
    }
    return x1 < 0 ? null : { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

const lienzo = (ancho, alto) => Object.assign(document.createElement('canvas'), { width: ancho, height: alto });
const aBlob = (canvas, tipo) => new Promise((listo) => canvas.toBlob(listo, tipo, 0.92));

/**
 * @param {Blob} foto - Imagen elegida o hecha con la cámara.
 * @param {Function} alAvanzar - Recibe un texto con el paso en curso.
 * @returns {Promise<string>} Dirección local (blob:) del PNG recortado.
 */
export async function quitarFondo(foto, alAvanzar) {
    const original = await createImageBitmap(foto);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(original.width, original.height));
    const reducida = lienzo(Math.round(original.width * escala), Math.round(original.height * escala));
    reducida.getContext('2d').drawImage(original, 0, 0, reducida.width, reducida.height);

    // Se carga aquí y no al abrir la app: pesa mucho y solo hace falta al añadir una prenda
    const { removeBackground } = await import('@imgly/background-removal');
    const sinFondo = await removeBackground(await aBlob(reducida, 'image/jpeg'), {
        progress: (clave, hecho, total) => alAvanzar(
            clave.startsWith('fetch') ? `Descargando el modelo… ${Math.round((hecho / total) * 100)} %` : 'Quitando el fondo…'
        ),
    });

    const imagen = await createImageBitmap(sinFondo);
    const completa = lienzo(imagen.width, imagen.height);
    const ctx = completa.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imagen, 0, 0);
    const c = caja(ctx.getImageData(0, 0, imagen.width, imagen.height).data, imagen.width, imagen.height);
    if (!c) throw new Error('No se ha encontrado ninguna prenda en la foto.');

    const recortada = lienzo(c.ancho, c.alto);
    recortada.getContext('2d').drawImage(completa, c.x, c.y, c.ancho, c.alto, 0, 0, c.ancho, c.alto);
    return URL.createObjectURL(await aBlob(recortada, 'image/png'));
}
