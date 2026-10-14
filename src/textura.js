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

// La prenda se mide por rodajas horizontales de este alto, en metros
const RODAJA = 0.02;

/** Longitud de la elipse de semiejes `a` (de lado) y `b` (de fondo) desde el frente hasta el ángulo `t` (0 a π). */
const arco = (a, b, t) => {
    // La elipse es suave: con la regla de Simpson y 8 tramos el error es de milímetros
    const paso = t / 8, largo = (s) => Math.hypot(a * Math.cos(s), b * Math.sin(s));
    let suma = largo(0) + largo(t);
    for (let k = 1; k < 8; k++) suma += (k % 2 ? 4 : 2) * largo(k * paso);
    return (suma * paso) / 3;
};

/**
 * Coordenadas de textura (u, v por vértice) que envuelven la prenda con el trozo de tela repetido.
 * Cada rodaja de la prenda se toma por una elipse de su ancho y su fondo, centrada en ella, y u es lo
 * recorrido sobre esa elipse desde el frente: así la tela va a su tamaño en el frente, el costado y la
 * espalda, también donde el cuerpo se ensancha o se echa atrás (la cadera, el pecho). Las mangas no
 * cuentan para la elipse; entre las piernas, que no tienen tronco, cuenta toda la rodaja.
 * @param {Float32Array} posiciones - x, y, z de cada vértice, en metros.
 * @param {ArrayLike<number>|null} indices - Los vértices de cada triángulo, de tres en tres (null: en orden).
 * @param {number[]} referencia - Franja [desde, hasta] de la prenda, de 0 (arriba) a 1 (abajo), donde
 *   se midió el ancho de su cuerpo en la foto.
 * @param {number} proporcion - Lado del trozo de tela dividido por ese ancho, los dos en la foto. La
 *   prenda sale extendida en la foto, así que ese ancho es la mitad de su contorno.
 */
export function envoltura(posiciones, indices, [desde, hasta], proporcion) {
    let arriba = -Infinity, abajo = Infinity, izquierda = Infinity, derecha = -Infinity;
    for (let i = 0; i < posiciones.length; i += 3) {
        arriba = Math.max(arriba, posiciones[i + 1]);
        abajo = Math.min(abajo, posiciones[i + 1]);
        izquierda = Math.min(izquierda, posiciones[i]);
        derecha = Math.max(derecha, posiciones[i]);
    }
    const centro = (izquierda + derecha) / 2; // las prendas son simétricas
    const total = Math.max(1, Math.ceil((arriba - abajo) / RODAJA));

    // El corte de cada rodaja a media altura: por dónde cruzan su plano los triángulos, como tramos
    // [x, z, x, z]. Con tramos y no con vértices, el corte es continuo aunque la malla sea basta.
    const cortes = Array.from({ length: total }, () => []);
    const vertices = indices ?? Array.from({ length: posiciones.length / 3 }, (_, i) => i);
    for (let t = 0; t < vertices.length; t += 3) {
        const esquinas = [vertices[t] * 3, vertices[t + 1] * 3, vertices[t + 2] * 3];
        const ys = esquinas.map((i) => posiciones[i + 1]);
        const primera = Math.max(0, Math.ceil((arriba - Math.max(...ys)) / RODAJA - 0.5));
        const ultima = Math.min(total - 1, Math.floor((arriba - Math.min(...ys)) / RODAJA - 0.5));
        for (let k = primera; k <= ultima; k++) {
            const y = arriba - (k + 0.5) * RODAJA, tramo = [];
            for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
                if (ys[a] > y === ys[b] > y) continue;
                const f = (y - ys[a]) / (ys[b] - ys[a]), i = esquinas[a], j = esquinas[b];
                tramo.push(posiciones[i] + f * (posiciones[j] - posiciones[i]), posiciones[i + 2] + f * (posiciones[j + 2] - posiciones[i + 2]));
            }
            if (tramo.length === 4) cortes[k].push(tramo);
        }
    }

    // La elipse de cada rodaja: [x del centro, z del centro, semieje de lado, semieje de fondo]
    const medidas = cortes.map((tramos) => {
        if (tramos.length === 0) return null;
        // Lo que ocupa el corte a lo ancho, en piezas: el tronco es una; cada brazo, otra
        const piezas = [];
        for (const [i, d] of tramos.map(([x0, , x1]) => [Math.min(x0, x1), Math.max(x0, x1)]).sort((p, q) => p[0] - q[0])) {
            const ultima = piezas.at(-1);
            if (ultima && i <= ultima[1] + 0.001) ultima[1] = Math.max(ultima[1], d);
            else piezas.push([i, d]);
        }
        // La del centro: el tronco, sin los brazos. Entre las piernas no hay ninguna: entonces, todas.
        const [i, d] = piezas.find(([i, d]) => i <= centro && centro <= d) ?? [piezas[0][0], piezas.at(-1)[1]];
        let delante = -Infinity, detras = Infinity;
        for (const [x0, z0, x1, z1] of tramos) {
            if (x0 >= i && x0 <= d) [delante, detras] = [Math.max(delante, z0), Math.min(detras, z0)];
            if (x1 >= i && x1 <= d) [delante, detras] = [Math.max(delante, z1), Math.min(detras, z1)];
        }
        // Con un mínimo de medio centímetro: un corte de un solo tramo no da elipse
        return [(i + d) / 2, (delante + detras) / 2, Math.max(0.005, (d - i) / 2), Math.max(0.005, (delante - detras) / 2)];
    });
    // Una rodaja sin corte toma la elipse de la de encima (o de la primera que tenga)
    const alguna = medidas.find(Boolean);
    let elipses = medidas.map((elipse, k) => elipse ?? medidas.slice(0, k).findLast(Boolean) ?? alguna);
    // Suavizada con sus vecinas: sin saltos entre rodajas al pasar del hombro al brazo o de la cadera a las piernas
    elipses = elipses.map((_, k) => {
        const vecinas = elipses.slice(Math.max(0, k - 2), k + 3);
        return [0, 1, 2, 3].map((c) => vecinas.reduce((suma, elipse) => suma + elipse[c], 0) / vecinas.length);
    });
    // La elipse a la altura de cada vértice, entre las de las dos rodajas más cercanas
    const elipseEn = (y) => {
        const f = Math.min(total - 1, Math.max(0, (arriba - y) / RODAJA - 0.5));
        const k = Math.min(total - 2, Math.floor(f)), peso = f - k;
        if (k < 0) return elipses[0];
        return elipses[k].map((valor, c) => valor * (1 - peso) + elipses[k + 1][c] * peso);
    };

    // La escala: en la franja de la foto, el trozo de tela es `proporcion` de la mitad del contorno. Solo
    // valen las rodajas cerradas, con tela delante y detrás del centro: en una espalda al aire o entre las
    // piernas no hay contorno que medir. Si en la franja no hay ninguna, vale la cerrada más cercana. Se
    // miden sin suavizar, o la de junto a una espalda al aire saldría aplanada por sus vecinas.
    const cerradas = cortes.map((tramos) => tramos.filter(([x0, , x1]) => x0 < centro !== x1 < centro).length >= 2);
    const alto = arriba - abajo;
    const medio = Math.min(total - 1, Math.floor((alto * (desde + hasta)) / 2 / RODAJA));
    const validas = [...medidas.keys()].filter((k) => cerradas[k]);
    const enFranja = validas.filter((k) => {
        const y = arriba - (k + 0.5) * RODAJA;
        return y <= arriba - alto * desde && y >= arriba - alto * hasta;
    });
    const cercana = validas.sort((p, q) => Math.abs(p - medio) - Math.abs(q - medio))[0];
    const escala = (enFranja.length > 0 ? enFranja : [cercana]).map((k) => medidas[k] ?? elipses[medio]);
    const semicontorno = escala.reduce((suma, [, , a, b]) => suma + arco(a, b, Math.PI), 0) / escala.length;
    const lado = semicontorno * proporcion; // lado del trozo de tela, en metros

    const uv = new Float32Array((posiciones.length / 3) * 2);
    for (let i = 0, j = 0; i < posiciones.length; i += 3, j += 2) {
        const [x, z, a, b] = elipseEn(posiciones[i + 1]);
        // Sin signo: los dos costados son simétricos y no hay costura en la espalda, donde el ángulo
        // saltaría de +180° a -180° y apretaría muchas repeticiones en un solo triángulo.
        const angulo = Math.abs(Math.atan2((posiciones[i] - x) / a, (posiciones[i + 2] - z) / b));
        uv[j] = arco(a, b, angulo) / lado;
        uv[j + 1] = (arriba - posiciones[i + 1]) / lado;
    }
    return uv;
}

/**
 * El relieve del tejido sacado de la propia foto, como mapa de normales: lo claro se toma por alto y lo
 * oscuro por hondo. Así la trama, el punto o las rayas reciben la luz como tela y no parecen pintados.
 * Va sobre el trozo ya sin la luz de la foto, para que un pliegue no se tome por relieve.
 * @param {Uint8ClampedArray} pixeles - RGBA del trozo, de `lado` x `lado`.
 * @param {number} fuerza - Cuánto se inclina la normal por cada nivel de luminancia (0-255).
 * @returns {Uint8Array} RGBA del mapa de normales: (128, 128, 255) es plano.
 */
export function relieve(pixeles, lado, fuerza = 0.02) {
    const alto = (x, y) => luminancia(pixeles, (Math.min(lado - 1, Math.max(0, y)) * lado + Math.min(lado - 1, Math.max(0, x))) * 4);
    const normales = new Uint8Array(lado * lado * 4);
    for (let y = 0; y < lado; y++) {
        for (let x = 0; x < lado; x++) {
            const nx = -(alto(x + 1, y) - alto(x - 1, y)) * fuerza;
            const ny = -(alto(x, y + 1) - alto(x, y - 1)) * fuerza;
            const largo = Math.hypot(nx, ny, 1);
            const i = (y * lado + x) * 4;
            normales[i] = Math.round((nx / largo * 0.5 + 0.5) * 255);
            normales[i + 1] = Math.round((ny / largo * 0.5 + 0.5) * 255);
            normales[i + 2] = Math.round((1 / largo * 0.5 + 0.5) * 255);
            normales[i + 3] = 255;
        }
    }
    return normales;
}
