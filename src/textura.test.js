import test from 'node:test';
import assert from 'node:assert/strict';
import { trozoDeTela, quitarLuz, envoltura } from './textura.js';

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

test('la tela envuelve la prenda a su tamaño real', () => {
    // Un "cuerpo" de 0,4 m de ancho, de y = 1 a y = 0, y un trozo de tela de la mitad de ese ancho (0,2 m)
    const posiciones = new Float32Array([
        0, 1, 0.2, // frente, arriba
        0, 0, 0.2, // frente, abajo
        0.2, 0.5, 0, // costado
        -0.2, 0.5, 0, // otro costado
        0, 0.5, -0.2, // espalda
    ]);
    const uv = [...envoltura(posiciones, [0, 1], 0.5)].map((x) => Math.round(x * 100) / 100);
    // De arriba abajo hay 1 m: 5 trozos. Del frente a cada costado, un cuarto de vuelta (0,31 m): 1,57 trozos.
    assert.deepEqual(uv, [0, 0, 0, 5, 1.57, 2.5, 1.57, 2.5, 3.14, 2.5]);
});
