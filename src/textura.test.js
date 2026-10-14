import test from 'node:test';
import assert from 'node:assert/strict';
import { trozoDeTela, quitarLuz, envoltura, relieve } from './textura.js';

// Imagen RGBA de ancho x alto, opaca donde `opaco(x, y)`
const imagen = (ancho, alto, opaco) => {
    const pixeles = new Uint8ClampedArray(ancho * alto * 4);
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) if (opaco(x, y)) pixeles[(y * ancho + x) * 4 + 3] = 255;
    return pixeles;
};

test('el trozo de tela sale de la zona más uniforme, lejos de los bordes', () => {
    // Una prenda gris de 80 x 80 en (10, 10), sobre fondo, con una costura oscura en su parte izquierda
    const pixeles = imagen(100, 100, (x, y) => x >= 10 && x < 90 && y >= 10 && y < 90);
    for (let i = 0; i < pixeles.length; i += 4) pixeles.fill(150, i, i + 3);
    for (let y = 0; y < 100; y++) for (let x = 20; x < 24; x++) pixeles.fill(20, (y * 100 + x) * 4, (y * 100 + x) * 4 + 3);
    const trozo = trozoDeTela(pixeles, 100, 100, 30);
    assert.equal(trozo.lado, 30);
    assert.ok(trozo.x >= 24, 'no toca la costura');
    assert.ok(trozo.y >= 14 && trozo.x + 30 <= 86 && trozo.y + 30 <= 86, 'deja margen hasta el fondo');
});

test('el trozo no pasa del 80 % de la zona limpia, y una prenda sin zona limpia no da trozo', () => {
    const cuerpo = imagen(100, 100, (x, y) => x >= 20 && x < 80 && y >= 30 && y < 90);
    assert.equal(trozoDeTela(cuerpo, 100, 100, 1000).lado, 48);
    assert.equal(trozoDeTela(imagen(100, 100, (x) => x % 2 === 0), 100, 100, 30), null);
});

test('quitar la luz iguala lo claro y lo oscuro, pero deja las rayas', () => {
    // Rayas finas (una fila clara, una oscura) bajo una luz que va de la izquierda, oscura, a la derecha, clara
    const lado = 40, pixeles = new Uint8ClampedArray(lado * lado * 4);
    for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
        const i = (y * lado + x) * 4;
        pixeles.fill((y % 2 ? 80 : 160) * (0.5 + x / lado), i, i + 3);
        pixeles[i + 3] = 255;
    }
    const columna = (x) => { let s = 0; for (let y = 0; y < lado; y++) s += pixeles[(y * lado + x) * 4]; return s / lado; };
    const antes = columna(37) - columna(2);
    quitarLuz(pixeles, lado);
    const raya = (y) => pixeles[(y * lado + 20) * 4];
    assert.ok(Math.abs(columna(37) - columna(2)) < antes / 4, `la diferencia de luz baja de ${antes} a ${columna(37) - columna(2)}`);
    assert.ok(raya(20) - raya(21) > 50, 'las rayas siguen');
});

// Un tubo de 1 m de alto con un anillo de `vuelta` vértices cada 5 cm, unidos en triángulos, de sección
// elíptica: `a` de lado y `b` de fondo. El vértice 0 de cada anillo es el centro del frente; el de un cuarto
// de vuelta, el costado; el de media vuelta, la espalda.
const VUELTA = 64;
// De `y0` a `y1`. Abierto, solo la mitad de delante, de costado a costado: como una espalda al aire.
const tubo = ({ a = 0.15, b = 0.1, x = 0, centro = () => 0, vuelta = VUELTA, y0 = 0, y1 = 1, abierto = false } = {}) => {
    const posiciones = [], indices = [];
    const pasos = abierto ? vuelta / 2 + 1 : vuelta;
    for (let n = 0; n <= 20; n++) {
        const y = y0 + ((y1 - y0) * n) / 20;
        for (let k = 0; k < pasos; k++) {
            const s = (2 * Math.PI * (abierto ? k - vuelta / 4 : k)) / vuelta;
            posiciones.push(x + a * Math.sin(s), y, centro(y) + b * Math.cos(s));
            if (n === 0 || (abierto && k === pasos - 1)) continue;
            const p = (n - 1) * pasos + k, q = (n - 1) * pasos + ((k + 1) % pasos);
            indices.push(p, q, p + pasos, q, q + pasos, p + pasos);
        }
    }
    return { posiciones, indices };
};
// Varios tubos en una sola malla
const juntos = (...tubos) => tubos.reduce((malla, { posiciones, indices }) => ({
    posiciones: [...malla.posiciones, ...posiciones],
    indices: [...malla.indices, ...indices.map((i) => i + malla.posiciones.length / 3)],
}), { posiciones: [], indices: [] });
const envolver = ({ posiciones, indices }, referencia, proporcion) => envoltura(new Float32Array(posiciones), indices, referencia, proporcion);
// Lo que ocupa el anillo n en las uv (u, v de cada vértice) y en las posiciones
const anillo = (lista, n, porVertice, vuelta = VUELTA) => lista.slice(n * vuelta * porVertice, (n + 1) * vuelta * porVertice);
const distancia = (p, i, j) => Math.hypot(p[i * 3] - p[j * 3], p[i * 3 + 1] - p[j * 3 + 1], p[i * 3 + 2] - p[j * 3 + 2]);

test('la tela envuelve la prenda a su tamaño real: la foto es la prenda extendida, la mitad de su contorno', () => {
    const malla = tubo(), posiciones = malla.posiciones;
    // El contorno medido sobre el propio anillo
    let contorno = 0;
    for (let k = 0; k < VUELTA; k++) contorno += distancia(posiciones, k, (k + 1) % VUELTA);
    // El trozo de tela mide un cuarto del ancho de la prenda extendida: 4 trozos de frente a espalda
    const lado = (contorno / 2) * 0.25;
    const uv = envolver(malla, [0, 1], 0.25);
    const medio = anillo(uv, 10, 2), puntos = anillo(posiciones, 10, 3);
    assert.ok(Math.abs(medio[0]) < 0.01, 'el frente empieza en 0');
    assert.ok(Math.abs(medio[16 * 2] - 2) < 0.05, `al costado, 2 trozos (${medio[32]})`);
    assert.ok(Math.abs(medio[32 * 2] - 4) < 0.05, `a la espalda, 4 trozos (${medio[64]})`);
    // La tela no se aprieta en el frente ni se estira en el costado: cada tramo del anillo lleva su largo de tela
    for (let k = 0; k < 32; k++) {
        const tela = (medio[(k + 1) * 2] - medio[k * 2]) * lado;
        const real = distancia(puntos, k, k + 1);
        assert.ok(Math.abs(tela / real - 1) < 0.03, `tramo ${k}: ${tela.toFixed(4)} m de tela para ${real.toFixed(4)} m de prenda`);
    }
    // De arriba abajo, también a su tamaño: el anillo 10 está 0,5 m por debajo del borde de arriba
    assert.ok(Math.abs(medio[1] - 0.5 / lado) < 0.01);
});

test('la tela no se aprieta donde la prenda se echa atrás, como en la cadera', () => {
    // Un tubo que abajo queda 6 cm más atrás que arriba, medido arriba
    const malla = tubo({ centro: (y) => -0.06 * (1 - y) }), posiciones = malla.posiciones;
    const uv = envolver(malla, [0, 0.2], 0.25);
    for (const n of [4, 16]) {
        const medio = anillo(uv, n, 2), puntos = anillo(posiciones, n, 3);
        assert.ok(Math.abs(medio[0]) < 0.01 && Math.abs(medio[64] - 4) < 0.1, `anillo ${n}: frente en 0 y espalda en 4`);
        const frente = medio[2] / (medio[16 * 2] / 16); // primer tramo del frente frente al promedio hasta el costado
        assert.ok(Math.abs(frente - distancia(puntos, 0, 1) / (distancia(puntos, 0, 16) / 16)) < 0.15, `anillo ${n}: ${frente}`);
    }
});

test('las mangas no cuentan para la escala aunque vayan a 1 cm, y unas piernas sueltas también se envuelven', () => {
    // El tronco y, a 1 cm de cada costado, un brazo de 8 cm de grueso
    const malla = juntos(tubo(), tubo({ a: 0.04, b: 0.04, x: 0.2 }), tubo({ a: 0.04, b: 0.04, x: -0.2 }));
    assert.ok(Math.abs(anillo(envolver(malla, [0, 1], 0.25), 10, 2)[64] - 4) < 0.05, 'la espalda del tronco sigue a 4 trozos');
    // Dos piernas sin tronco: entre ellas no hay centro
    const piernas = envolver(juntos(tubo({ a: 0.06, b: 0.06, x: 0.09 }), tubo({ a: 0.06, b: 0.06, x: -0.09 })), [0, 1], 0.25);
    assert.ok(piernas.every(Number.isFinite));
});

test('con la espalda al aire en la franja de la foto, la escala sale de la parte cerrada más cercana', () => {
    // Cerrado hasta 0,7 m y, de ahí arriba, solo por delante; la foto se midió arriba, en lo abierto
    const malla = juntos(tubo({ y1: 0.7 }), tubo({ y0: 0.7, abierto: true }));
    const espalda = anillo(envolver(malla, [0, 0.2], 0.25), 10, 2)[64];
    assert.ok(Math.abs(espalda - 4) < 0.05, `la espalda de la parte cerrada, a 4 trozos (${espalda})`);
});

test('una malla basta, con vértices a 6 cm, se envuelve igual', () => {
    // 16 vértices por vuelta: entre uno y otro del frente quedan 6 cm
    const uv = envolver(tubo({ vuelta: 16 }), [0, 1], 0.25);
    const medio = anillo(uv, 10, 2, 16);
    assert.ok(Math.abs(medio[0]) < 0.01 && Math.abs(medio[4 * 2] - 2) < 0.05 && Math.abs(medio[8 * 2] - 4) < 0.05, `frente, costado y espalda: ${medio[0]}, ${medio[8]}, ${medio[16]}`);
});

test('el relieve es plano en una tela lisa y se inclina hacia lo oscuro en una rampa', () => {
    const lado = 4, liso = new Uint8ClampedArray(lado * lado * 4).fill(120);
    const plano = relieve(liso, lado);
    for (let i = 0; i < plano.length; i += 4) assert.deepEqual([...plano.slice(i, i + 3)], [128, 128, 255]);
    // Más claro hacia la derecha: la superficie sube hacia allí y su normal mira a la izquierda (x < 128)
    const rampa = new Uint8ClampedArray(lado * lado * 4);
    for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) rampa.fill(60 * x, (y * lado + x) * 4, (y * lado + x) * 4 + 3);
    const inclinado = relieve(rampa, lado);
    const centro = (1 * lado + 1) * 4;
    assert.ok(inclinado[centro] < 128 && inclinado[centro + 1] === 128 && inclinado[centro + 2] < 255);
});
