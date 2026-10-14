// El armario guardado en el propio dispositivo (IndexedDB): cada prenda con su imagen ya recortada,
// su hueco y sus medidas. No sale del móvil.

let conexion;

const abrir = () => {
    // Pide al navegador que no lo borre cuando le falte espacio (algunos lo conceden y otros no)
    navigator.storage?.persist?.();
    return new Promise((listo, fallo) => {
        const peticion = indexedDB.open('armario', 1);
        peticion.onupgradeneeded = () => peticion.result.createObjectStore('prendas', { keyPath: 'id', autoIncrement: true });
        peticion.onsuccess = () => listo(peticion.result);
        peticion.onerror = () => fallo(peticion.error);
    });
};

const pedir = async (modo, accion) => {
    const db = await (conexion ??= abrir());
    return new Promise((listo, fallo) => {
        const transaccion = db.transaction('prendas', modo);
        const peticion = accion(transaccion.objectStore('prendas'));
        transaccion.oncomplete = () => listo(peticion.result);
        transaccion.onerror = () => fallo(transaccion.error);
    });
};

/** @returns {Promise<Array<{id: number, hueco: string, imagen: Blob, ancho: number, centro: number}>>} */
export const todas = () => pedir('readonly', (prendas) => prendas.getAll());
/** @returns {Promise<number>} El id que le ha dado la base de datos. */
export const guardar = (prenda) => pedir('readwrite', (prendas) => prendas.add(prenda));
export const borrar = (id) => pedir('readwrite', (prendas) => prendas.delete(id));
