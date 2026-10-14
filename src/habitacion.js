// El dormitorio en el que está el maniquí, hecho con piezas de three.js: suelo de tablas, paredes
// cálidas con rodapié y techo, una ventana con cortinas, una cama, una mesilla con su lámpara, una
// planta, un cuadro, una alfombra y un armario abierto. Colores lisos, sin texturas: no se descarga nada.
// Medidas en metros. El maniquí está en el origen, de cara a la cámara (+Z); la pared del fondo
// queda detrás de él, en z = -FONDO.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ANCHO = 6, FONDO = 2.6, DELANTE = 2.6, ALTO = 2.7; // el suelo va de z = -FONDO a z = DELANTE

// Aleatorio con semilla: las tablas salen siempre igual
const azar = (() => {
    let semilla = 1;
    return (desde, hasta) => {
        semilla = (semilla * 16807) % 2147483647;
        return desde + (hasta - desde) * (semilla / 2147483647);
    };
})();

/** La habitación entera, como un grupo con una malla por material (pocas llamadas de dibujo en el móvil). */
export function crearHabitacion() {
    const piezas = new Map(); // material -> geometrías, que se juntan al final

    const material = (color, rugosidad = 0.7, luz = 0) => new THREE.MeshStandardMaterial({
        color: new THREE.Color(...color), // valores lineales, como en Blender
        roughness: rugosidad,
        emissive: luz ? new THREE.Color(...color) : 0x000000,
        emissiveIntensity: luz,
    });
    const poner = (geometria, mat) => {
        if (!piezas.has(mat)) piezas.set(mat, []);
        piezas.get(mat).push(geometria);
        return geometria;
    };
    /** Un bloque de `ancho` x `alto` x `fondo`, con su centro en (x, y, z) y los cantos redondeados `bisel` metros. */
    const caja = ([x, y, z], [ancho, alto, fondo], mat, bisel = 0) => poner(
        (bisel ? new RoundedBoxGeometry(ancho, alto, fondo, 3, bisel) : new THREE.BoxGeometry(ancho, alto, fondo)).translate(x, y, z),
        mat
    );
    const cilindro = ([x, y, z], radio, alto, mat, radioArriba = radio, lados = 24) =>
        poner(new THREE.CylinderGeometry(radioArriba, radio, alto, lados).translate(x, y, z), mat);
    const barra = ([x, y, z], radio, largo, mat) =>
        poner(new THREE.CylinderGeometry(radio, radio, largo, 12).rotateZ(Math.PI / 2).translate(x, y, z), mat);

    const tablas = [[0.60, 0.42, 0.27], [0.55, 0.38, 0.24], [0.64, 0.47, 0.31]].map((c) => material(c, 0.55));
    const juntas = material([0.25, 0.17, 0.11], 0.9);
    const pared = material([0.80, 0.72, 0.63], 0.9);
    const techo = material([0.92, 0.90, 0.86], 0.9);
    const blanco = material([0.93, 0.92, 0.90], 0.5);
    const roble = material([0.70, 0.53, 0.36], 0.6);
    const nogal = material([0.36, 0.24, 0.16], 0.6);
    const hueco = material([0.33, 0.25, 0.18], 0.8);
    const metal = material([0.75, 0.73, 0.70], 0.3);
    const alfombra = material([0.72, 0.60, 0.50], 1);
    const lino = material([0.90, 0.86, 0.78], 0.95);
    lino.side = THREE.DoubleSide;
    const edredon = material([0.62, 0.66, 0.58], 0.95);
    const almohada = material([0.94, 0.92, 0.88], 0.95);
    const manta = material([0.72, 0.45, 0.33], 1);
    const barro = material([0.65, 0.36, 0.24], 0.8);
    const hojas = material([0.22, 0.38, 0.20], 0.7);
    const ventana = material([0.86, 0.90, 0.95], 0.5, 1.4);
    const pantalla = material([1, 0.82, 0.58], 0.8, 2);
    const pinturas = [[0.78, 0.55, 0.38], [0.36, 0.45, 0.42], [0.88, 0.80, 0.66]].map((c) => material(c, 0.8));

    // El suelo: tablas de 18 cm a lo largo, en trozos de largo variable y tres tonos, sobre juntas oscuras.
    // Su cara de arriba está a la altura 0, donde pisa el maniquí.
    const profundo = FONDO + DELANTE, centroZ = (DELANTE - FONDO) / 2;
    caja([0, -0.05, centroZ], [ANCHO, 0.06, profundo], juntas);
    for (let x = -ANCHO / 2; x < ANCHO / 2 - 0.01; x += 0.18) {
        const ancho = Math.min(0.18, ANCHO / 2 - x);
        for (let z = DELANTE + azar(0, 1); z > -FONDO;) {
            const largo = azar(1.2, 2.2);
            const desde = Math.min(z, DELANTE), hasta = Math.max(z - largo, -FONDO);
            caja([x + ancho / 2, -0.01, (desde + hasta) / 2], [ancho - 0.004, 0.02, desde - hasta - 0.004], tablas[Math.floor(azar(0, 3))]);
            z -= largo;
        }
    }

    // Paredes, techo y rodapiés
    caja([0, ALTO / 2, -FONDO - 0.05], [ANCHO + 0.2, ALTO, 0.1], pared);
    caja([0, ALTO + 0.05, centroZ], [ANCHO + 0.2, 0.1, profundo], techo);
    for (const lado of [-1, 1]) {
        caja([lado * (ANCHO / 2 + 0.05), ALTO / 2, centroZ], [0.1, ALTO, profundo], pared);
        caja([lado * (ANCHO / 2 - 0.01), 0.05, centroZ], [0.02, 0.1, profundo], blanco);
    }
    caja([0, 0.05, -FONDO + 0.01], [ANCHO, 0.1, 0.02], blanco);

    // La ventana, a la izquierda del fondo, con su marco y una cortina a cada lado
    const vx = -1.5, vz = -FONDO;
    caja([vx, 1.5, vz + 0.005], [1.1, 1.4, 0.01], ventana);
    for (const [x, y, ancho, alto] of [[vx, 0.77, 1.2, 0.06], [vx, 2.23, 1.2, 0.06], [vx - 0.58, 1.5, 0.06, 1.5], [vx + 0.58, 1.5, 0.06, 1.5], [vx, 1.5, 0.04, 1.4]]) {
        caja([x, y, vz + 0.02], [ancho, alto, 0.04], blanco);
    }
    caja([vx, 0.75, vz + 0.07], [1.3, 0.03, 0.14], blanco);
    barra([vx, 2.45, vz + 0.12], 0.012, 2, metal);
    for (const lado of [-1, 1]) {
        // Una tela que cuelga del riel, con un pliegue cada 12 cm
        const tela = new THREE.PlaneGeometry(0.45, 2.45, 18, 1);
        const posiciones = tela.attributes.position;
        for (let i = 0; i < posiciones.count; i++) posiciones.setZ(i, 0.035 * Math.sin((posiciones.getX(i) * 2 * Math.PI) / 0.12));
        tela.computeVertexNormals();
        poner(tela.translate(vx + lado * 0.78, 2.45 / 2 + 0.12, vz + 0.12), lino);
    }

    // La cama, contra la pared de la izquierda, con el cabecero en la pared del fondo
    const bx = -2.2, bz = -FONDO + 1.05;
    caja([bx, 0.6, -FONDO + 0.04], [1.5, 1, 0.06], nogal, 0.01);
    caja([bx, 0.17, bz], [1.5, 0.26, 2], nogal, 0.01);
    caja([bx, 0.4, bz], [1.4, 0.22, 1.95], almohada, 0.05);
    caja([bx, 0.52, bz + 0.25], [1.5, 0.08, 1.5], edredon, 0.035);
    caja([bx, 0.57, bz + 0.75], [1.52, 0.04, 0.45], manta, 0.02);
    for (const lado of [-1, 1]) caja([bx + lado * 0.35, 0.6, -FONDO + 0.3], [0.6, 0.16, 0.35], almohada, 0.07);

    // La mesilla, junto a la cama, con una lámpara encendida
    const mx = bx + 1.05, mz = -FONDO + 0.25;
    caja([mx, 0.27, mz], [0.48, 0.54, 0.42], roble, 0.01);
    caja([mx, 0.36, mz + 0.215], [0.4, 0.16, 0.01], nogal);
    cilindro([mx, 0.62, mz], 0.07, 0.16, barro);
    cilindro([mx, 0.81, mz], 0.17, 0.22, pantalla, 0.11);

    // Un cuadro sobre la cama, en la pared de la izquierda
    caja([-ANCHO / 2 + 0.02, 1.65, bz], [0.03, 0.65, 0.9], nogal);
    for (const [i, [dz, dy, az, ay]] of [[0.18, 0.05, 0.35, 0.45], [-0.17, 0.1, 0.3, 0.3], [-0.17, -0.15, 0.3, 0.15]].entries()) {
        caja([-ANCHO / 2 + 0.04, 1.65 + dy, bz + dz], [0.01, ay, az], pinturas[i]);
    }

    // Una planta en una maceta, entre la ventana y el armario
    const px = 0.85, pz = -FONDO + 0.3;
    cilindro([px, 0.2, pz], 0.17, 0.4, barro, 0.2);
    for (let i = 0; i < 9; i++) {
        const angulo = i * 2.4, radio = 0.08 + 0.02 * (i % 3);
        poner(new THREE.IcosahedronGeometry(azar(0.13, 0.19), 2).scale(1, 1.3, 1)
            .translate(px + radio * Math.cos(angulo), 0.55 + 0.09 * i, pz - radio * Math.sin(angulo)), hojas);
    }

    // La alfombra bajo el maniquí, de 8 mm
    caja([0, 0.004, -0.2], [2.4, 0.008, 1.7], alfombra, 0.003);

    // El armario, a la derecha del fondo, con las puertas abiertas y la barra para las perchas
    const ax = 1.9, anchoA = 1.6, fondoA = 0.6, altoA = 2.25, grosor = 0.03, az = -FONDO + fondoA / 2;
    caja([ax, altoA / 2, -FONDO + grosor / 2], [anchoA, altoA, grosor], hueco);
    for (const lado of [-1, 1]) caja([ax + lado * (anchoA / 2 - grosor / 2), altoA / 2, az], [grosor, altoA, fondoA], roble, 0.005);
    caja([ax, altoA - grosor / 2, az], [anchoA, grosor, fondoA], roble, 0.005);
    caja([ax, 0.08, az], [anchoA, grosor, fondoA], roble, 0.005);
    caja([ax, 1.9, az], [anchoA - 2 * grosor, 0.02, fondoA - grosor], roble);
    caja([ax, 0.035, az - 0.02], [anchoA, 0.07, fondoA - 0.04], hueco);
    barra([ax, 1.76, az], 0.012, anchoA - 2 * grosor, metal);
    // Cada puerta, cerrada, va de su bisagra (en un lado del frente) hacia el centro; girada 110°, se abre hacia la habitación
    for (const lado of [-1, 1]) {
        const bisagra = (geometria) => geometria.rotateY(lado * THREE.MathUtils.degToRad(110)).translate(ax + lado * anchoA / 2, altoA / 2 + 0.03, -FONDO + fondoA);
        poner(bisagra(new RoundedBoxGeometry(anchoA / 2 - 0.004, altoA - 0.1, 0.02, 3, 0.004).translate(-lado * anchoA / 4, 0, 0.01)), roble);
        poner(bisagra(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 12).translate(-lado * (anchoA / 2 - 0.06), 0, 0.05)), metal);
    }

    const grupo = new THREE.Group();
    for (const [mat, geometrias] of piezas) {
        // Unas piezas llegan con índice y otras sin él: para juntarlas, todas sin índice
        grupo.add(new THREE.Mesh(mergeGeometries(geometrias.map((g) => (g.index ? g.toNonIndexed() : g))), mat));
        for (const g of geometrias) g.dispose();
    }
    // La lámpara da una luz cálida de verdad a su alrededor; no llega al maniquí, para no cambiar el color de la ropa
    const lampara = new THREE.PointLight(0xffb070, 1.5, 2.2, 2);
    lampara.position.set(mx, 0.85, mz + 0.1);
    grupo.add(lampara);
    return grupo;
}
