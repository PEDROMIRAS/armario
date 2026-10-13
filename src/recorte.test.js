import test from 'node:test';
import assert from 'node:assert/strict';
import { caja } from './recorte.js';

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
