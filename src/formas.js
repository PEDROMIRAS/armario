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
