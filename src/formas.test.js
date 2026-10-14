import test from 'node:test';
import assert from 'node:assert/strict';
import { formas, extremoY } from './formas.js';

// Un cuerpo de 160 cm cuya forma "bajo" resta 40 cm y cuya forma "alto" suma 80
const modelo = { base: 160, tramoMenos: 40, tramoMas: 80 };

test('la altura pedida se reparte entre la forma baja y la alta', () => {
    assert.deepEqual(formas(160, 0, modelo), { bajo: 0, alto: 0, delgado: 0, corpulento: 0 });
    assert.deepEqual(formas(200, 0, modelo), { bajo: 0, alto: 0.5, delgado: 0, corpulento: 0 });
    assert.deepEqual(formas(150, 0, modelo), { bajo: 0.25, alto: 0, delgado: 0, corpulento: 0 });
});

test('la complexión solo aplica una de sus dos formas', () => {
    assert.deepEqual(formas(160, -0.3, modelo), { bajo: 0, alto: 0, delgado: 0.3, corpulento: 0 });
    assert.deepEqual(formas(160, 1, modelo), { bajo: 0, alto: 0, delgado: 0, corpulento: 1 });
});

test('la altura sale de la Y de los vértices, no de la X ni la Z', () => {
    // Tres vértices x, y, z: la X y la Z son mayores que cualquier Y, para que se note si se mira otra coordenada
    const array = new Float32Array([5, 1.6, 9, -5, 0.2, -9, 7, 0.8, 8]);
    assert.equal(extremoY({ array, count: 3 }), array[1]);
    assert.equal(extremoY({ array, count: 3 }, -1), array[4]);
});
