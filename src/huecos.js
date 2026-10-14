// Dónde va cada prenda, y la franja de su foto (`referencia`, de 0 arriba a 1 abajo) donde se mide su
// cuerpo para encajarla. Cada hueco tiene varias formas 3D en el catálogo de cada cuerpo
// (modelos/cuerpo.py → mujer.json): camiseta, blusa, vaqueros, falda…
// `quita`: los huecos que deja libres al ponerse, porque ocupan el mismo sitio.
export const HUECOS = [
    { id: 'arriba', nombre: 'Parte de arriba', referencia: [0.75, 0.95], quita: ['vestido'] }, // el bajo
    { id: 'abajo', nombre: 'Parte de abajo', referencia: [0.02, 0.12], quita: ['vestido'] }, // la cintura
    { id: 'vestido', nombre: 'Vestido', referencia: [0.28, 0.36], quita: ['arriba', 'abajo'] }, // sobre la cintura
];

/** Las prendas puestas tras poner `prenda` en `hueco`: sustituye a la que hubiera y quita las que choquen. */
export function vestir(prendas, hueco, prenda) {
    const nuevas = { ...prendas, [hueco.id]: prenda };
    for (const id of hueco.quita) delete nuevas[id];
    return nuevas;
}

/**
 * La forma 3D con la que se ve una prenda en el cuerpo cargado: la suya, si ese cuerpo la tiene, o la
 * primera de su hueco (una prenda guardada antes del catálogo, o de una forma que solo tiene el otro cuerpo).
 * @param {{hueco: string, forma?: string}} prenda
 * @param {{id: string, hueco: string}[]} catalogo
 * @returns {string|undefined} El id de la forma; nada si el cuerpo no tiene ninguna de su hueco.
 */
export function formaDe(prenda, catalogo) {
    const delHueco = catalogo.filter((forma) => forma.hueco === prenda.hueco);
    return (delHueco.find((forma) => forma.id === prenda.forma) ?? delHueco[0])?.id;
}
