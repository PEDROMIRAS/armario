// La tela de una foto, puesta sobre la prenda 3D del catálogo.
// No se usa la foto entera: su forma (cuello, mangas, la prenda extendida) nunca coincide con la de
// la prenda 3D. Se toma un trozo de tela limpia y uniforme de la foto, se le quita la luz con la que
// se hizo la foto y se repite alrededor de la prenda a su tamaño real, como un rollo de tela: así
// salen bien el color, el tejido y el estampado.

const luminancia = (pixeles, i) => 0.299 * pixeles[i] + 0.587 * pixeles[i + 1] + 0.114 * pixeles[i + 2];

/**
 * Un cuadrado de la foto que sea todo prenda (sin fondo), lejos de los bordes del recorte y del lado
 * pedido o menor. Entre los posibles, el más uniforme: así evita costuras, botones o un dibujo suelto,
 * que repetidos se ven falsos.
 * @param {number} deseado - Lado buscado, en píxeles.
 * @returns {{x: number, y: number, lado: number}|null} En píxeles; null si la prenda es demasiado fina.
 */
export function trozoDeTela(pixeles, ancho, alto, deseado, umbral = 200) {
    // Sobre una rejilla reducida: basta para encontrar la zona y es rápido con fotos grandes
    const paso = Math.max(1, Math.floor(Math.max(ancho, alto) / 200));
    const columnas = Math.floor(ancho / paso), filas = Math.floor(alto / paso), fila = columnas + 1;
    // lados[i] = lado del mayor cuadrado opaco que acaba en la celda i (por abajo a la derecha)
    const lados = new Uint16Array(columnas * filas);
    // Sumas acumuladas de la luminancia y de su cuadrado, para la varianza de cualquier cuadrado al instante
    const suma = new Float64Array((filas + 1) * fila), suma2 = new Float64Array((filas + 1) * fila);
    let mayor = 0;
    for (let f = 0; f < filas; f++) {
        for (let c = 0; c < columnas; c++) {
            const p = (f * paso * ancho + c * paso) * 4;
            const l = luminancia(pixeles, p);
            const k = (f + 1) * fila + c + 1;
            suma[k] = l + suma[k - 1] + suma[k - fila] - suma[k - fila - 1];
            suma2[k] = l * l + suma2[k - 1] + suma2[k - fila] - suma2[k - fila - 1];
            if (pixeles[p + 3] < umbral) continue;
            const i = f * columnas + c;
            lados[i] = f && c ? 1 + Math.min(lados[i - 1], lados[i - columnas], lados[i - columnas - 1]) : 1;
            mayor = Math.max(mayor, lados[i]);
        }
    }
    // Se deja una quinta parte del lado como margen hasta el fondo
    const lado = Math.max(1, Math.min(Math.floor(mayor * 0.8), Math.round(deseado / paso)));
    const conMargen = Math.min(mayor, Math.ceil(lado / 0.8));
    if (lado * paso < 8) return null;

    const area = (datos, f, c) => datos[(f + lado) * fila + c + lado] - datos[f * fila + c + lado] - datos[(f + lado) * fila + c] + datos[f * fila + c];
    let mejor = null;
    for (let f = 0; f < filas; f++) {
        for (let c = 0; c < columnas; c++) {
            if (lados[f * columnas + c] < conMargen) continue;
            // El cuadrado buscado, centrado dentro del limpio con margen que acaba en esta celda
            const desplazado = Math.floor((conMargen - lado) / 2);
            const arriba = f - conMargen + 1 + desplazado, izquierda = c - conMargen + 1 + desplazado;
            const n = lado * lado, media = area(suma, arriba, izquierda) / n;
            const varianza = area(suma2, arriba, izquierda) / n - media * media;
            if (!mejor || varianza < mejor.varianza) mejor = { varianza, arriba, izquierda };
        }
    }
    return { x: mejor.izquierda * paso, y: mejor.arriba * paso, lado: lado * paso };
}

/**
 * Quita a un trozo de tela cuadrado la luz con la que se hizo la foto: los pliegues, las sombras y los
 * brillos grandes, que repetidos parecen manchas. Lo fino (el tejido, unas rayas) se queda. Cada píxel
 * se aclara u oscurece según lo que se aparte su entorno, muy desenfocado, de la media del trozo.
 * @param {Uint8ClampedArray} pixeles - RGBA del trozo, que se cambia en su sitio.
 */
export function quitarLuz(pixeles, lado, radio = Math.max(2, Math.round(lado / 5))) {
    const fila = lado + 1, suma = new Float64Array(fila * fila);
    let total = 0;
    for (let y = 0; y < lado; y++) {
        for (let x = 0; x < lado; x++) {
            const l = luminancia(pixeles, (y * lado + x) * 4);
            const k = (y + 1) * fila + x + 1;
            suma[k] = l + suma[k - 1] + suma[k - fila] - suma[k - fila - 1];
            total += l;
        }
    }
    const media = total / (lado * lado);
    for (let y = 0; y < lado; y++) {
        const y0 = Math.max(0, y - radio), y1 = Math.min(lado, y + radio + 1);
        for (let x = 0; x < lado; x++) {
            const x0 = Math.max(0, x - radio), x1 = Math.min(lado, x + radio + 1);
            const entorno = (suma[y1 * fila + x1] - suma[y0 * fila + x1] - suma[y1 * fila + x0] + suma[y0 * fila + x0]) / ((y1 - y0) * (x1 - x0));
            // Sin pasarse: en una zona casi negra o casi blanca no hay luz que recuperar
            const factor = Math.min(2, Math.max(0.5, media / Math.max(entorno, 1)));
            const i = (y * lado + x) * 4;
            for (let c = 0; c < 3; c++) pixeles[i + c] = pixeles[i + c] * factor;
        }
    }
}

/**
 * Coordenadas de textura (u, v por vértice) que envuelven la prenda con el trozo de tela repetido.
 * Envuelve alrededor del eje vertical, como un cilindro, para que el costado y la espalda lleven la
 * misma tela que el frente sin estirarse.
 * @param {Float32Array} posiciones - x, y, z de cada vértice, en metros.
 * @param {number[]} referencia - Franja [desde, hasta] de la prenda, de 0 (arriba) a 1 (abajo), donde
 *   se midió el ancho de su cuerpo en la foto.
 * @param {number} proporcion - Lado del trozo de tela dividido por ese ancho, los dos en la foto.
 */
export function envoltura(posiciones, [desde, hasta], proporcion) {
    let arriba = -Infinity, abajo = Infinity;
    for (let i = 1; i < posiciones.length; i += 3) {
        arriba = Math.max(arriba, posiciones[i]);
        abajo = Math.min(abajo, posiciones[i]);
    }
    const alto = arriba - abajo;

    // El cuerpo de la malla en la misma franja que la foto: su ancho da la escala y su centro, el eje
    let izquierda = Infinity, derecha = -Infinity, delante = -Infinity, detras = Infinity;
    for (let i = 0; i < posiciones.length; i += 3) {
        const y = posiciones[i + 1];
        if (y > arriba - alto * desde || y < arriba - alto * hasta) continue;
        izquierda = Math.min(izquierda, posiciones[i]);
        derecha = Math.max(derecha, posiciones[i]);
        delante = Math.max(delante, posiciones[i + 2]);
        detras = Math.min(detras, posiciones[i + 2]);
    }
    const ancho = derecha - izquierda;
    const lado = ancho * proporcion; // lado del trozo de tela, en metros
    const ejeX = (izquierda + derecha) / 2, ejeZ = (delante + detras) / 2;

    const uv = new Float32Array((posiciones.length / 3) * 2);
    for (let i = 0, j = 0; i < posiciones.length; i += 3, j += 2) {
        // Distancia recorrida alrededor del cuerpo desde el frente, medida en un círculo de su mismo ancho.
        // Sin signo: los dos costados son simétricos y no hay costura en la espalda, donde el ángulo
        // saltaría de +180° a -180° y apretaría muchas repeticiones en un solo triángulo.
        const angulo = Math.abs(Math.atan2(posiciones[i] - ejeX, posiciones[i + 2] - ejeZ));
        uv[j] = (angulo * ancho) / 2 / lado;
        uv[j + 1] = (arriba - posiciones[i + 1]) / lado;
    }
    return uv;
}
