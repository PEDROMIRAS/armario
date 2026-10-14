// La foto recortada de una prenda, puesta como textura sobre la prenda 3D del catálogo.
// Se proyecta de frente: el cuerpo de la prenda en la foto (medido en una franja, como en recorte.js)
// cae sobre el cuerpo de la malla medido en la misma franja, y de arriba abajo la foto entera cubre
// la malla entera. La espalda no sale en la foto: recibe la misma proyección que el frente, que se ve
// continua por los costados aunque repita detrás el dibujo de delante.

/**
 * Coordenadas de textura (u, v por vértice) que proyectan la foto de frente sobre la malla.
 * @param {Float32Array} posiciones - x, y, z de cada vértice, en metros.
 * @param {{ancho: number, centro: number}} medida - Ancho y centro del cuerpo de la prenda en la foto,
 *   como fracciones del ancho de la foto.
 * @param {number[]} referencia - Franja [desde, hasta] donde se midió, de 0 (arriba) a 1 (abajo).
 */
export function proyeccion(posiciones, medida, [desde, hasta]) {
    let arriba = -Infinity, abajo = Infinity;
    for (let i = 1; i < posiciones.length; i += 3) {
        arriba = Math.max(arriba, posiciones[i]);
        abajo = Math.min(abajo, posiciones[i]);
    }
    const alto = arriba - abajo;

    // Ancho y centro de la malla en la misma franja que la foto
    let izquierda = Infinity, derecha = -Infinity;
    for (let i = 0; i < posiciones.length; i += 3) {
        const y = posiciones[i + 1];
        if (y > arriba - alto * desde || y < arriba - alto * hasta) continue;
        izquierda = Math.min(izquierda, posiciones[i]);
        derecha = Math.max(derecha, posiciones[i]);
    }
    const escala = medida.ancho / (derecha - izquierda);
    const centro = (izquierda + derecha) / 2;

    const limitar = (valor) => Math.min(1, Math.max(0, valor));
    const uv = new Float32Array((posiciones.length / 3) * 2);
    for (let i = 0, j = 0; i < posiciones.length; i += 3, j += 2) {
        uv[j] = limitar(medida.centro + (posiciones[i] - centro) * escala);
        uv[j + 1] = limitar((arriba - posiciones[i + 1]) / alto);
    }
    return uv;
}

/** Color medio [r, g, b] de los píxeles visibles de una imagen RGBA: rellena lo que la foto no cubre. */
export function colorMedio(pixeles) {
    const suma = [0, 0, 0];
    let peso = 0;
    for (let i = 0; i < pixeles.length; i += 4) {
        const alfa = pixeles[i + 3];
        for (let c = 0; c < 3; c++) suma[c] += pixeles[i + c] * alfa;
        peso += alfa;
    }
    return peso ? suma.map((s) => Math.round(s / peso)) : [128, 128, 128];
}
