// El armario guardado en el propio dispositivo (IndexedDB). No sale del móvil.
// - prendas: cada una con su imagen ya recortada, su hueco y sus medidas.
// - conjuntos: lo que te pusiste en una ocasión, con su nombre.

let conexion;

const abrir = () => {
    // Pide al navegador que no lo borre cuando le falte espacio (algunos lo conceden y otros no)
    navigator.storage?.persist?.();
    return new Promise((listo, fallo) => {
        // Versión 2: añade los conjuntos. Lo guardado en la 1 se conserva.
        const peticion = indexedDB.open('armario', 2);
        peticion.onupgradeneeded = () => {
            for (const nombre of ['prendas', 'conjuntos']) {
                if (!peticion.result.objectStoreNames.contains(nombre)) peticion.result.createObjectStore(nombre, { keyPath: 'id', autoIncrement: true });
            }
        };
        peticion.onsuccess = () => {
            // Si otra pestaña con una versión nueva necesita la base, se suelta: si no, esa pestaña se queda esperando
            peticion.result.onversionchange = () => peticion.result.close();
            listo(peticion.result);
        };
        peticion.onerror = () => fallo(peticion.error);
    });
};

const almacen = (nombre) => {
    const pedir = async (modo, accion) => {
        const db = await (conexion ??= abrir());
        return new Promise((listo, fallo) => {
            const transaccion = db.transaction(nombre, modo);
            const peticion = accion(transaccion.objectStore(nombre));
            transaccion.oncomplete = () => listo(peticion.result);
            // Sin espacio, el navegador cancela la transacción sin evento de error
            transaccion.onerror = transaccion.onabort = () => fallo(transaccion.error);
        });
    };
    return {
        todas: () => pedir('readonly', (lista) => lista.getAll()),
        /** @returns {Promise<number>} El id que le ha dado la base de datos. */
        guardar: (elemento) => pedir('readwrite', (lista) => lista.add(elemento)),
        borrar: (id) => pedir('readwrite', (lista) => lista.delete(id)),
    };
};

/** Elementos: {id, hueco, imagen: Blob, ancho} (las más antiguas traen también un `centro` que ya no se usa) */
export const prendas = almacen('prendas');
/** Elementos: {id, nombre, puestas: {hueco: id de prenda}} */
export const conjuntos = almacen('conjuntos');
