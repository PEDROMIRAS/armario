import test from 'node:test';
import assert from 'node:assert/strict';
import { HUECOS, vestir, formaDe } from './huecos.js';

const hueco = (id) => HUECOS.find((h) => h.id === id);

test('el vestido quita la parte de arriba y la de abajo', () => {
    assert.deepEqual(vestir({ arriba: 'camiseta', abajo: 'falda' }, hueco('vestido'), 'vestido'), { vestido: 'vestido' });
});

test('una parte de arriba o de abajo quita el vestido, pero no la otra parte', () => {
    assert.deepEqual(vestir({ vestido: 'vestido' }, hueco('arriba'), 'camiseta'), { arriba: 'camiseta' });
    assert.deepEqual(vestir({ arriba: 'camiseta' }, hueco('abajo'), 'falda'), { arriba: 'camiseta', abajo: 'falda' });
});

test('una prenda nueva sustituye a la del mismo hueco', () => {
    assert.deepEqual(vestir({ arriba: 'camiseta' }, hueco('arriba'), 'blusa'), { arriba: 'blusa' });
});

test('una prenda se ve con su forma, o con la primera de su hueco si el cuerpo no la tiene', () => {
    const catalogo = [
        { id: 'camiseta', hueco: 'arriba' }, { id: 'blusa', hueco: 'arriba' }, { id: 'vaqueros', hueco: 'abajo' },
    ];
    assert.equal(formaDe({ hueco: 'arriba', forma: 'blusa' }, catalogo), 'blusa');
    assert.equal(formaDe({ hueco: 'arriba' }, catalogo), 'camiseta'); // guardada antes del catálogo
    assert.equal(formaDe({ hueco: 'arriba', forma: 'vaqueros' }, catalogo), 'camiseta'); // forma de otro hueco
    assert.equal(formaDe({ hueco: 'vestido', forma: 'halter' }, catalogo), undefined); // este cuerpo no tiene vestidos
});
