// Dónde va cada prenda: la malla 3D del catálogo sobre la que se pone su foto (modelos/cuerpo.py), y
// la franja de la foto (`referencia`, de 0 arriba a 1 abajo) donde se mide su cuerpo para encajarla.
// `quita`: los huecos que deja libres al ponerse, porque ocupan el mismo sitio.
export const HUECOS = [
    { id: 'arriba', nombre: 'Parte de arriba', malla: 'camiseta', referencia: [0.75, 0.95], quita: ['vestido'] }, // el bajo
    { id: 'abajo', nombre: 'Parte de abajo', malla: 'pantalon', referencia: [0.02, 0.12], quita: ['vestido'] }, // la cintura
    { id: 'vestido', nombre: 'Vestido', malla: 'vestido', referencia: [0.28, 0.36], quita: ['arriba', 'abajo'] }, // sobre la cintura
];

/** Las prendas puestas tras poner `prenda` en `hueco`: sustituye a la que hubiera y quita las que choquen. */
export function vestir(prendas, hueco, prenda) {
    const nuevas = { ...prendas, [hueco.id]: prenda };
    for (const id of hueco.quita) delete nuevas[id];
    return nuevas;
}
