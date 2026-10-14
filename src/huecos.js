// Dónde va cada prenda: la malla 3D del catálogo sobre la que se pone su foto (modelos/cuerpo.py), y
// la franja de la foto (`referencia`, de 0 arriba a 1 abajo) donde se mide su cuerpo para encajarla.
export const HUECOS = [
    { id: 'arriba', nombre: 'Parte de arriba', malla: 'camiseta', referencia: [0.75, 0.95] }, // el bajo
    { id: 'abajo', nombre: 'Parte de abajo', malla: 'pantalon', referencia: [0.02, 0.12] }, // la cintura
];
