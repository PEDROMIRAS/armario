import test from 'node:test';
import assert from 'node:assert/strict';
import { caja, franja } from './recorte.js';

// Imagen de 5x4 transparente con un bloque visible de 2x2 en (1,1)
const imagen = (visibles) => {
    const pixeles = new Uint8ClampedArray(5 * 4 * 4);
    for (const [x, y] of visibles) pixeles[(y * 5 + x) * 4 + 3] = 255;
    return pixeles;
};

test('la caja se ajusta a lo visible', () => {
    assert.deepEqual(caja(imagen([[1, 1], [2, 1], [1, 2], [2, 2]]), 5, 4), { x: 1, y: 1, ancho: 2, alto: 2 });
    assert.deepEqual(caja(imagen([[0, 0], [4, 3]]), 5, 4), { x: 0, y: 0, ancho: 5, alto: 4 });
});

test('una imagen vacía o casi transparente no tiene caja', () => {
    assert.equal(caja(imagen([]), 5, 4), null);
    const tenue = imagen([]);
    tenue[3] = 10; // por debajo del umbral: restos del recorte, no prenda
    assert.equal(caja(tenue, 5, 4), null);
});

test('la franja mide el cuerpo de la prenda, no las mangas', () => {
    // Una "camiseta" de 10x6: mangas de lado a lado arriba (2 filas) y cuerpo de 4 de ancho debajo, descentrado
    const ancho = 10, alto = 6;
    const pixeles = new Uint8ClampedArray(ancho * alto * 4);
    const pintar = (x, y) => { pixeles[(y * ancho + x) * 4 + 3] = 255; };
    for (let y = 0; y < 2; y++) for (let x = 0; x < 10; x++) pintar(x, y);
    for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) pintar(x, y);
    const c = caja(pixeles, ancho, alto);
    assert.deepEqual(franja(pixeles, ancho, c, 0.5, 1), { ancho: 0.4 });
    assert.deepEqual(franja(pixeles, ancho, c, 0, 0.3), { ancho: 1 });
});
