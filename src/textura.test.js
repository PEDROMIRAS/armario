import test from 'node:test';
import assert from 'node:assert/strict';
import { proyeccion, colorMedio } from './textura.js';

// Una "camiseta" de 4 vértices: cuello arriba (y = 1) y bajo (y = 0), de 2 m de ancho en el bajo
const posiciones = new Float32Array([
    -0.5, 1, 0, // hombro izquierdo
    0.5, 1, 0, // hombro derecho
    -1, 0, 0, // bajo izquierdo
    1, 0, 0, // bajo derecho
]);

test('el cuerpo de la prenda en la foto cae sobre el cuerpo de la malla', () => {
    // En la foto, el bajo ocupa la mitad central: del 25 % al 75 % del ancho
    const uv = proyeccion(posiciones, { ancho: 0.5, centro: 0.5 }, [0.75, 1]);
    assert.deepEqual([...uv], [0.375, 0, 0.625, 0, 0.25, 1, 0.75, 1]);
});

test('lo que se sale de la foto se queda en su borde', () => {
    const uv = proyeccion(posiciones, { ancho: 1, centro: 0.2 }, [0.75, 1]);
    assert.equal(uv[4], 0); // el bajo izquierdo caería en -0.3
});

test('el color medio solo cuenta lo visible, según su opacidad', () => {
    const pixeles = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 0]);
    assert.deepEqual(colorMedio(pixeles), [128, 0, 128]);
    assert.deepEqual(colorMedio(new Uint8ClampedArray(8)), [128, 128, 128]);
});
