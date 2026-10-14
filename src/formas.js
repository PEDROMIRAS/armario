/**
 * Cuánto hay que aplicar cada forma del modelo (de 0 a 1) para unas medidas dadas.
 * @param {number} altura - En cm.
 * @param {number} complexion - De -1 (delgado) a 1 (corpulento).
 * @param {{base: number, tramoMenos: number, tramoMas: number}} modelo - Altura del cuerpo base, en cm,
 *   y cuántos cm le quita la forma "bajo" entera y le suma la forma "alto" entera.
 */
export function formas(altura, complexion, modelo) {
    const desvio = altura - modelo.base;
    return {
        bajo: Math.max(0, -desvio / modelo.tramoMenos),
        alto: Math.max(0, desvio / modelo.tramoMas),
        delgado: Math.max(0, -complexion),
        corpulento: Math.max(0, complexion),
    };
}

/**
 * Mayor valor (o menor, con signo -1) de la coordenada Y en las posiciones de una malla de three.js.
 * @param {{array: ArrayLike<number>, count: number}} posiciones - x, y, z de cada vértice, seguidos.
 */
export function extremoY(posiciones, signo = 1) {
    let extremo = -Infinity;
    for (let i = 1; i < posiciones.count * 3; i += 3) extremo = Math.max(extremo, signo * posiciones.array[i]);
    return signo * extremo;
}
