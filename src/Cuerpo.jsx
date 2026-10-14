import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { formas, extremoY } from './formas.js';
import { trozoDeTela, quitarLuz, envoltura, relieve } from './textura.js';
import { crearHabitacion } from './habitacion.js';
import './Cuerpo.css';

// Un archivo por cuerpo base; cada uno trae las formas bajo, alto, delgado y corpulento (modelos/cuerpo.py)
const CUERPOS = [
    { id: 'mujer', nombre: 'Mujer' },
    { id: 'hombre', nombre: 'Hombre' },
];
// Tus medidas se eligen al entrar la primera vez y se recuerdan entre visitas
const leerMedidas = () => {
    try { return JSON.parse(localStorage.getItem('medidas')); } catch { return null; }
};
const ALTURA = { min: 145, max: 205 }; // cm: las formas extremas del modelo van mucho más allá de una persona

/**
 * La tela de la prenda: un trozo limpio y uniforme de su foto, sin la luz de la foto, que se repite en
 * espejo para que no se noten los cortes entre copias, y su relieve. `proporcion` es su lado dividido por
 * el ancho del cuerpo de la prenda.
 */
const tela = async (prenda) => {
    const foto = await createImageBitmap(prenda.imagen);
    const lienzo = Object.assign(document.createElement('canvas'), { width: foto.width, height: foto.height });
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(foto, 0, 0);
    // Un tercio del ancho del cuerpo de la prenda: cabe en casi cualquiera y lleva tejido de sobra.
    // Una prenda sin zona limpia (muy fina o con agujeros) usa la foto entera.
    const deseado = (prenda.ancho * foto.width) / 3;
    const trozo = trozoDeTela(ctx.getImageData(0, 0, foto.width, foto.height).data, foto.width, foto.height, deseado)
        ?? { x: 0, y: 0, lado: Math.min(foto.width, foto.height) };
    const muestra = Object.assign(document.createElement('canvas'), { width: trozo.lado, height: trozo.lado });
    const pincel = muestra.getContext('2d');
    pincel.drawImage(foto, trozo.x, trozo.y, trozo.lado, trozo.lado, 0, 0, trozo.lado, trozo.lado);
    const pixeles = pincel.getImageData(0, 0, trozo.lado, trozo.lado);
    quitarLuz(pixeles.data, trozo.lado);
    pincel.putImageData(pixeles, 0, 0);
    const proporcion = trozo.lado / (prenda.ancho * foto.width);
    foto.close(); // cerrada, su ancho pasa a ser 0
    const mapa = new THREE.CanvasTexture(muestra);
    mapa.colorSpace = THREE.SRGBColorSpace;
    mapa.wrapS = mapa.wrapT = THREE.MirroredRepeatWrapping;
    mapa.flipY = false; // v crece hacia abajo, como en la foto: los estampados no salen del revés
    const bultos = new THREE.DataTexture(relieve(pixeles.data, trozo.lado), trozo.lado, trozo.lado);
    bultos.wrapS = bultos.wrapT = THREE.MirroredRepeatWrapping;
    bultos.needsUpdate = true;
    return { mapa, bultos, proporcion };
};

/** Pone a una malla las formas del cuerpo (bajo, alto, delgado, corpulento) en la medida de cada una. */
const ajustar = (malla, influencias) => {
    for (const [nombre, valor] of Object.entries(influencias)) malla.morphTargetInfluences[malla.morphTargetDictionary[nombre]] = valor;
};

/** Suelta la memoria gráfica de una malla. */
const soltar = (malla) => {
    malla.geometry.dispose();
    malla.material.map?.dispose();
    malla.material.normalMap?.dispose();
    malla.material.dispose();
};

/** Textura en la que se juntan máscaras de la piel, en el espacio de la textura de la piel. */
const nuevaMascara = () => {
    const textura = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 512, height: 512 }));
    textura.flipY = false; // como las texturas del modelo
    textura.minFilter = textura.magFilter = THREE.NearestFilter;
    textura.generateMipmaps = false;
    return textura;
};

/** Junta en `textura` estas máscaras: lo blanco de cualquiera queda blanco. */
const juntar = (textura, mascaras) => {
    const lienzo = textura.image;
    const pincel = lienzo.getContext('2d');
    pincel.globalCompositeOperation = 'source-over';
    pincel.clearRect(0, 0, lienzo.width, lienzo.height);
    pincel.globalCompositeOperation = 'lighten';
    for (const imagen of mascaras) pincel.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    textura.needsUpdate = true;
};

/**
 * Una forma de prenda del catálogo (vaqueros, blusa…) y la máscara de la piel que tapa. Se descarga la primera
 * vez que se pone y se guarda en el modelo para las siguientes.
 */
const pieza = (modelo, forma) => {
    if (!modelo.ropa.has(forma)) {
        const imagen = new Image();
        imagen.src = `${modelo.url}/${forma}.png`;
        const hueco = modelo.catalogo.find((f) => f.id === forma)?.hueco;
        modelo.ropa.set(forma, Promise.all([new GLTFLoader().loadAsync(`${modelo.url}/${forma}.glb`), imagen.decode()]).then(([gltf]) => {
            let malla;
            gltf.scene.traverse((objeto) => { if (objeto.isMesh) malla = objeto; });
            // Tela: mate, con el brillo suave de los tejidos en los bordes (sheen). Es una sola capa: por las
            // mangas y el cuello se ve su cara interior
            malla.material = new THREE.MeshPhysicalMaterial({
                roughness: 0.85, sheen: 1, sheenRoughness: 0.6, sheenColor: 0x404040,
                normalScale: new THREE.Vector2(0.6, 0.6), side: THREE.DoubleSide,
            });
            // Sus coordenadas de textura son las de la piel que tiene debajo (modelos/cuerpo.py); las de la tela
            // se le ponen con la foto
            malla.geometry.setAttribute('piel', malla.geometry.attributes.uv);
            if (hueco === 'abajo') {
                // La parte de arriba va por fuera: lo del pantalón o la falda que quede sobre la piel que ella tapa
                // (el verde de su máscara, mirado píxel a píxel hasta el bajo) no se pinta, o la cinturilla la atraviesa
                malla.material.onBeforeCompile = (shader) => {
                    shader.uniforms.tapaArriba = { value: modelo.tapaArriba };
                    shader.vertexShader = `attribute vec2 piel;\nvarying vec2 vPiel;\n${shader.vertexShader.replace(
                        '#include <uv_vertex>',
                        '#include <uv_vertex>\nvPiel = piel;'
                    )}`;
                    shader.fragmentShader = `uniform sampler2D tapaArriba;\nvarying vec2 vPiel;\n${shader.fragmentShader.replace(
                        '#include <map_fragment>',
                        'if (texture2D(tapaArriba, vPiel).g > 0.5) discard;\n#include <map_fragment>'
                    )}`;
                };
            }
            malla.castShadow = malla.receiveShadow = true;
            malla.visible = false;
            if (modelo.descartado) soltar(malla);
            else {
                ajustar(malla, modelo.influencias);
                modelo.grupo.add(malla);
                modelo.mallas.push(malla);
            }
            return { malla, mascara: imagen };
        }).catch((error) => {
            modelo.ropa.delete(forma); // para que se pueda volver a intentar
            throw error;
        }));
    }
    return modelo.ropa.get(forma);
};

/**
 * Maniquí 3D ajustable, vestido con las fotos de las prendas puestas.
 * @param {object} props
 * @param {Object<string, {id: number|string, imagen: Blob, ancho: number, referencia: number[], forma: string}>} props.prendas
 *   La prenda puesta en cada hueco (arriba, abajo, vestido), con la forma del catálogo con la que se ve.
 * @param {(catalogo: {id: string, hueco: string, nombre: string}[]) => void} props.alCargar - Recibe el
 *   catálogo de formas del cuerpo cargado (modelos/cuerpo.py → mujer.json): cada cuerpo tiene las suyas.
 */
export default function Cuerpo({ prendas, alCargar }) {
    const lienzo = useRef(null);
    const escena = useRef(null);
    const pintar = useRef(() => {});
    // El cuerpo cargado va dentro de este grupo, que es el que se gira
    const maniqui = useRef(new THREE.Group());
    const [guardadas] = useState(leerMedidas);
    // Sin medidas guardadas se empieza ajustando el maniquí
    const [ajustando, setAjustando] = useState(!guardadas);
    const [sexo, setSexo] = useState(guardadas?.sexo ?? 'mujer');
    // Lo cargado: sus mallas y cuánto mide, en cm, el cuerpo base y cuánto le suman o restan las formas
    const [modelo, setModelo] = useState(null);
    const [altura, setAltura] = useState(guardadas?.altura ?? null); // null = la del cuerpo base
    const [complexion, setComplexion] = useState(guardadas?.complexion ?? 0);
    const [estado, setEstado] = useState('');

    useEffect(() => {
        const canvas = lienzo.current;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Pensado para fotos de producto: no cambia el tono de los colores, y la ropa sale de su color
        renderer.toneMapping = THREE.NeutralToneMapping;
        escena.current = new THREE.Scene();
        // La cámara se queda quieta delante, como un espejo; lo que gira es el maniquí
        // Algo alejada y abierta, para que se vea la habitación alrededor
        const camara = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
        camara.position.set(0, 1.25, 3.9);
        camara.lookAt(0, 1, 0);
        escena.current.add(maniqui.current);

        // La habitación no cambia con el cuerpo
        const habitacion = crearHabitacion();
        habitacion.traverse((objeto) => { objeto.receiveShadow = true; });
        escena.current.add(habitacion);
        // La luz llega por todos lados desde una foto 360° de una habitación real (Poly Haven, CC0), sin
        // tinte para no cambiar el color de la ropa. Mientras se descarga, una habitación de three.js.
        const generador = new THREE.PMREMGenerator(renderer);
        let entorno = generador.fromScene(new RoomEnvironment(), 0.04).texture;
        escena.current.environment = entorno;
        let cerrado = false;
        new HDRLoader().load(`${import.meta.env.BASE_URL}luz.hdr`, (foto) => {
            if (!cerrado) {
                entorno.dispose();
                entorno = generador.fromEquirectangular(foto).texture;
                escena.current.environment = entorno;
                pintar.current();
            }
            foto.dispose();
            generador.dispose();
        }, undefined, (error) => { console.error(error); generador.dispose(); });
        // Un foco que da volumen y proyecta la sombra del cuerpo en el suelo y de la ropa sobre sí misma
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap; // la suave ya no existe en three.js: también usa esta
        const foco = new THREE.DirectionalLight(0xffffff, 1.2);
        foco.position.set(1.5, 3, 2.5);
        foco.castShadow = true;
        foco.shadow.mapSize.set(1024, 1024);
        Object.assign(foco.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 1, far: 8 });
        foco.shadow.bias = -0.0005;
        foco.shadow.normalBias = 0.02; // sin esto, las formas del cuerpo se manchan de rayas de sombra
        escena.current.add(foco);

        // Sombra difusa bajo los pies: sin ella el cuerpo parece flotar
        const degradado = Object.assign(document.createElement('canvas'), { width: 64, height: 64 });
        const pincel = degradado.getContext('2d');
        const mancha = pincel.createRadialGradient(32, 32, 0, 32, 32, 32);
        mancha.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        mancha.addColorStop(1, 'rgba(0, 0, 0, 0)');
        pincel.fillStyle = mancha;
        pincel.fillRect(0, 0, 64, 64);
        const sombra = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(degradado), transparent: true, depthWrite: false })
        );
        sombra.position.y = 0.01; // justo encima de la alfombra, que mide 8 mm
        escena.current.add(sombra);

        // Se pinta solo cuando algo cambia, no en cada fotograma: ahorra batería en el móvil
        pintar.current = () => renderer.render(escena.current, camara);

        // Arrastrar en horizontal gira el maniquí, como al darte la vuelta delante del espejo
        let x = null;
        const empezar = (e) => { x = e.clientX; canvas.setPointerCapture(e.pointerId); };
        const mover = (e) => {
            if (x === null) return;
            maniqui.current.rotation.y += (e.clientX - x) * 0.01;
            x = e.clientX;
            pintar.current();
        };
        const soltar = () => { x = null; };
        canvas.addEventListener('pointerdown', empezar);
        canvas.addEventListener('pointermove', mover);
        canvas.addEventListener('pointerup', soltar);
        canvas.addEventListener('pointercancel', soltar);

        const observador = new ResizeObserver(() => {
            renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
            camara.aspect = canvas.clientWidth / canvas.clientHeight;
            camara.updateProjectionMatrix();
            pintar.current();
        });
        observador.observe(canvas);

        return () => {
            cerrado = true;
            observador.disconnect();
            canvas.removeEventListener('pointerdown', empezar);
            canvas.removeEventListener('pointermove', mover);
            canvas.removeEventListener('pointerup', soltar);
            canvas.removeEventListener('pointercancel', soltar);
            habitacion.traverse((objeto) => {
                if (!objeto.isMesh) return;
                objeto.geometry.dispose();
                objeto.material.dispose();
            });
            entorno.dispose();
            sombra.geometry.dispose();
            sombra.material.map.dispose();
            sombra.material.dispose();
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        let cancelado = false;
        setEstado('Cargando el cuerpo…');
        const url = `${import.meta.env.BASE_URL}modelos/${sexo}`;
        Promise.all([new GLTFLoader().loadAsync(`${url}.glb`), fetch(`${url}.json`).then((respuesta) => respuesta.json())]).then(([gltf, catalogo]) => {
            if (cancelado) return;
            const mallas = [];
            let cuerpo;
            // La piel que tapan las prendas puestas no se pinta: si no, asoma por la tela ceñida. Cada prenda trae
            // una máscara con la piel que tapa (modelos/cuerpo.py), y las de lo que llevas se juntan en esta textura.
            // En la otra, solo la de la parte de arriba, para no pintar lo que esta tapa del pantalón o la falda.
            const tapada = nuevaMascara(), tapaArriba = nuevaMascara();
            gltf.scene.traverse((objeto) => {
                if (!objeto.isMesh) return;
                mallas.push(objeto);
                objeto.castShadow = objeto.receiveShadow = true;
                if (objeto.material.name === 'piel') {
                    cuerpo = objeto;
                    // La piel trae su textura. Con un brillo suave y rosado en los bordes, como la piel con luz
                    // de lado, en vez del brillo de plástico
                    const textura = objeto.material.map;
                    objeto.material.dispose();
                    objeto.material = new THREE.MeshPhysicalMaterial({ map: textura, roughness: 0.6, sheen: 0.4, sheenRoughness: 0.5, sheenColor: 0xffc8b0 });
                    objeto.material.onBeforeCompile = (shader) => {
                        shader.uniforms.tapada = { value: tapada };
                        shader.fragmentShader = `uniform sampler2D tapada;\n${shader.fragmentShader.replace(
                            '#include <map_fragment>',
                            'if (texture2D(tapada, vMapUv).r > 0.5) discard;\n#include <map_fragment>'
                        )}`;
                    };
                } else {
                    // El pelo, las cejas y las pestañas son láminas con textura: se recortan por su transparencia
                    // y se ven por las dos caras
                    objeto.material.alphaTest = 0.4;
                    objeto.material.transparent = false;
                    // El cargador la desactiva en los materiales transparentes; sin ella, el cuerpo y la prenda se pintan encima
                    objeto.material.depthWrite = true;
                    objeto.material.side = THREE.DoubleSide;
                }
            });
            const forma = (nombre) => cuerpo.geometry.morphAttributes.position[cuerpo.morphTargetDictionary[nombre]];
            // Las medidas van antes de añadirlo: si el archivo no trae el cuerpo esperado, no llega a la escena
            const medidas = {
                base: Math.round(extremoY(cuerpo.geometry.attributes.position) * 100),
                tramoMas: extremoY(forma('alto')) * 100,
                tramoMenos: -extremoY(forma('bajo'), -1) * 100,
            };
            maniqui.current.add(gltf.scene);
            // `ropa`: las prendas ya descargadas (forma -> promesa de {malla, mascara}); `influencias`: las formas
            // del cuerpo aplicadas ahora, para ponérselas también a una prenda que llegue después
            setModelo({ grupo: gltf.scene, mallas, catalogo, url, tapada, tapaArriba, ropa: new Map(), influencias: {}, ...medidas });
            setEstado('');
        }).catch((error) => {
            console.error(error);
            if (!cancelado) setEstado('No se ha podido cargar el cuerpo.');
        });
        return () => { cancelado = true; };
    }, [sexo]);

    // Al cambiar de cuerpo, el anterior sale de la escena y suelta su memoria gráfica
    useEffect(() => () => {
        if (!modelo) return;
        modelo.descartado = true; // una prenda que termine de descargarse después ya no se añade
        maniqui.current.remove(modelo.grupo);
        for (const malla of modelo.mallas) soltar(malla);
        modelo.tapada.dispose();
        modelo.tapaArriba.dispose();
    }, [modelo]);

    useEffect(() => {
        if (modelo) alCargar(modelo.catalogo);
    }, [modelo, alCargar]);

    const alturaActual = altura ?? modelo?.base ?? 166;

    const terminar = () => {
        try { localStorage.setItem('medidas', JSON.stringify({ sexo, altura: alturaActual, complexion })); } catch { /* sin almacenamiento: se vuelven a pedir */ }
        setAjustando(false);
    };

    useEffect(() => {
        if (!modelo) return;
        modelo.influencias = formas(alturaActual, complexion, modelo);
        // El pelo y la ropa llevan las mismas formas que el cuerpo, para seguirlo
        for (const malla of modelo.mallas) ajustar(malla, modelo.influencias);
        pintar.current();
    }, [modelo, alturaActual, complexion]);

    useEffect(() => {
        if (!modelo) return;
        let cancelado = false;
        (async () => {
            const puestas = Object.values(prendas);
            const piezas = await Promise.all(puestas.map((prenda) => pieza(modelo, prenda.forma)));
            if (cancelado) return;
            for (const [i, prenda] of puestas.entries()) {
                const { malla } = piezas[i];
                // Solo se rehace la textura si cambia la prenda de esa malla (el objeto se crea de nuevo en cada cambio: vale el id)
                if (malla.userData.foto === prenda.id) continue;
                const { mapa, bultos, proporcion } = await tela(prenda);
                if (cancelado) { mapa.dispose(); bultos.dispose(); return; }
                const uv = envoltura(malla.geometry.attributes.position.array, malla.geometry.index?.array, prenda.referencia, proporcion);
                malla.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                malla.material.map?.dispose();
                malla.material.normalMap?.dispose();
                malla.material.map = mapa;
                malla.material.normalMap = bultos;
                malla.material.needsUpdate = true;
                malla.userData.foto = prenda.id;
            }
            const llevadas = new Set(puestas.map((prenda) => prenda.forma));
            for (const [forma, descarga] of modelo.ropa) {
                const { malla } = await descarga;
                malla.visible = llevadas.has(forma);
            }
            juntar(modelo.tapada, piezas.map(({ mascara }) => mascara));
            juntar(modelo.tapaArriba, piezas.filter((_, i) => puestas[i].hueco === 'arriba').map(({ mascara }) => mascara));
            pintar.current();
        })().catch((error) => {
            console.error(error);
            setEstado('No se ha podido poner la prenda en el maniquí.');
        });
        return () => { cancelado = true; };
    }, [modelo, prendas]);

    return (
        <section className="cuerpo" aria-label="Tu maniquí">
            {ajustando && (
                <>
                    <p className="ajuste">Primero, ajusta el maniquí a ti.</p>
                    <div className="opciones" role="group" aria-label="Cuerpo base">
                        {CUERPOS.map(({ id, nombre }) => (
                            <button key={id} aria-pressed={sexo === id} onClick={() => { setSexo(id); setAltura(null); }}>{nombre}</button>
                        ))}
                    </div>
                </>
            )}
            <canvas ref={lienzo} aria-label="Maniquí en 3D. Arrastra para girarlo." role="img" />
            <p role="status" className="estado">{estado}</p>
            {ajustando ? (
                <>
                    <label>
                        Altura: {alturaActual} cm
                        <input type="range" min={ALTURA.min} max={ALTURA.max} step="1" value={alturaActual} onChange={(e) => setAltura(Number(e.target.value))} />
                    </label>
                    <label>
                        Complexión
                        <input type="range" min="-1" max="1" step="0.01" value={complexion} onChange={(e) => setComplexion(Number(e.target.value))} />
                    </label>
                    <button className="listo" onClick={terminar}>Listo</button>
                </>
            ) : (
                <button className="medidas" onClick={() => setAjustando(true)}>Cambiar tus medidas</button>
            )}
        </section>
    );
}
