// Cada prenda se escala para que su cuerpo (medido en `referencia`, una franja de la foto) ocupe
// `ancho` del maniquí, y se cuelga desde `alto`. Porcentajes sobre la silueta de 100 x 200.
// `quita`: los huecos que deja libres al ponerse, porque ocupan el mismo sitio.
export const HUECOS = [
    { id: 'arriba', nombre: 'Parte de arriba', referencia: [0.75, 0.95], ancho: 40, alto: 14, quita: ['vestido'] }, // el bajo, desde los hombros
    { id: 'abajo', nombre: 'Parte de abajo', referencia: [0.02, 0.12], ancho: 37, alto: 44, quita: ['vestido'] }, // la cintura
    { id: 'vestido', nombre: 'Vestido', referencia: [0.28, 0.36], ancho: 36, alto: 14, quita: ['arriba', 'abajo'] }, // sobre la cintura, desde los hombros
];

/** Las prendas puestas tras poner `prenda` en `hueco`: sustituye a la que hubiera y quita las que choquen. */
export function vestir(prendas, hueco, prenda) {
    const nuevas = { ...prendas, [hueco.id]: prenda };
    for (const id of hueco.quita) delete nuevas[id];
    return nuevas;
}
