import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { crearHabitacion, ANCHO, FONDO, DELANTE, ALTO } from './habitacion.js';

const habitacion = crearHabitacion();
const vertices = (malla) => {
    const p = malla.geometry.attributes.position;
    return Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p, i));
};

test('ningún mueble ocupa el sitio del maniquí', () => {
    habitacion.traverse((objeto) => {
        if (!objeto.isMesh) return;
        for (const v of vertices(objeto)) {
            // Un cilindro de 45 cm de radio alrededor del maniquí, de 1 cm a 2 m de alto, libre
            const dentro = Math.hypot(v.x, v.z) < 0.45 && v.y > 0.01 && v.y < 2;
            assert.ok(!dentro, `vértice en ${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`);
        }
    });
});

test('el maniquí pisa la alfombra, a 8 mm del suelo', () => {
    habitacion.updateMatrixWorld();
    const [toque] = new THREE.Raycaster(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)).intersectObject(habitacion);
    assert.ok(Math.abs(toque.point.y - 0.008) < 1e-6, `pisa a ${toque.point.y}`);
});

test('todo queda dentro de las paredes', () => {
    const caja = new THREE.Box3().setFromObject(habitacion);
    assert.ok(caja.min.x >= -ANCHO / 2 - 0.11 && caja.max.x <= ANCHO / 2 + 0.11);
    assert.ok(caja.min.z >= -FONDO - 0.11 && caja.max.z <= DELANTE + 0.01);
    assert.ok(caja.min.y >= -0.09 && caja.max.y <= ALTO + 0.11);
});
