import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { formas, extremoY } from './formas.js';
import { HUECOS } from './huecos.js';
import { trozoDeTela, quitarLuz, envoltura } from './textura.js';
import './Cuerpo.css';

// Un archivo por cuerpo base; cada uno trae las formas bajo, alto, delgado y corpulento (modelos/cuerpo.py)
const CUERPOS = [
    { id: 'mujer', nombre: 'Mujer' },
    { id: 'hombre', nombre: 'Hombre' },
];
// Las prendas que trae cada archivo, como mallas con este nombre (modelos/cuerpo.py)
const PRENDAS = HUECOS.map((hueco) => hueco.malla);
// Tus medidas se eligen al entrar la primera vez y se recuerdan entre visitas
const leerMedidas = () => {
    try { return JSON.parse(localStorage.getItem('medidas')); } catch { return null; }
};
const ALTURA = { min: 145, max: 205 }; // cm: las formas extremas del modelo van mucho más allá de una persona

/**
 * La tela de la prenda: un trozo limpio y uniforme de su foto, sin la luz de la foto, que se repite en
 * espejo para que no se noten los cortes entre copias. `proporcion` es su lado dividido por el ancho del
 * cuerpo de la prenda.
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
    return { mapa, proporcion };
};

/**
 * Maniquí 3D ajustable, vestido con las fotos de las prendas puestas.
 * @param {object} props
 * @param {Object<string, {id: number|string, imagen: Blob, ancho: number, referencia: number[]}>} props.prendas
 *   La prenda puesta en cada malla del catálogo (camiseta, pantalon, vestido); sin prenda, no se pinta.
 * @param {(mallas: string[]) => void} props.alCargar - Recibe las mallas de prenda que trae el cuerpo cargado:
 *   no todos los modelos traen todas.
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
        const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
        camara.position.set(0, 1.15, 3.6);
        camara.lookAt(0, 0.95, 0);
        escena.current.add(maniqui.current);

        // La habitación (modelos/habitacion.py): se carga una vez y no cambia con el cuerpo
        let habitacion, cerrado = false;
        new GLTFLoader().load(`${import.meta.env.BASE_URL}modelos/habitacion.glb`, (gltf) => {
            if (cerrado) return;
            habitacion = gltf.scene;
            escena.current.add(habitacion);
            pintar.current();
        }, undefined, console.error); // sin habitación el maniquí se sigue viendo, sobre el fondo de la página
        // La luz de una habitación por todos lados, que marca los pliegues, y un foco que da volumen
        const generador = new THREE.PMREMGenerator(renderer);
        const entorno = generador.fromScene(new RoomEnvironment(), 0.04).texture;
        generador.dispose();
        escena.current.environment = entorno;
        const foco = new THREE.DirectionalLight(0xffffff, 1.2);
        foco.position.set(1.5, 3, 2.5);
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
        sombra.position.y = 0.011; // justo encima de la alfombra
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
            habitacion?.traverse((objeto) => {
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
        new GLTFLoader().load(
            `${import.meta.env.BASE_URL}modelos/${sexo}.glb`,
            (gltf) => {
                if (cancelado) return;
                const mallas = [];
                let cuerpo;
                gltf.scene.traverse((objeto) => {
                    if (!objeto.isMesh) return;
                    mallas.push(objeto);
                    // El cuerpo llega en varias piezas, que se distinguen por el nombre de su material: "piel" es
                    // la que nunca se tapa, y "bajo_camiseta" o "bajo_camiseta_pantalon", la que queda bajo esas prendas
                    const pieza = objeto.material.name;
                    if (pieza === 'piel' || pieza.startsWith('bajo_')) {
                        // La piel trae su textura; mate, para que no brille como el plástico
                        objeto.material.roughness = 0.75;
                        objeto.userData.bajo = pieza.split('_').slice(1);
                        if (pieza === 'piel') cuerpo = objeto;
                    } else if (PRENDAS.includes(objeto.name)) {
                        // La tela es una sola capa: por las mangas y el cuello se ve su cara interior
                        objeto.material = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide });
                        objeto.userData.prenda = objeto.name;
                    } else {
                        // El pelo son láminas con textura: se recorta por su transparencia y se ve por las dos caras
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
                setModelo({ grupo: gltf.scene, mallas, ...medidas });
                setEstado('');
            },
            undefined,
            () => { if (!cancelado) setEstado('No se ha podido cargar el cuerpo.'); }
        );
        return () => { cancelado = true; };
    }, [sexo]);

    // Al cambiar de cuerpo, el anterior sale de la escena y suelta su memoria gráfica
    useEffect(() => () => {
        if (!modelo) return;
        maniqui.current.remove(modelo.grupo);
        for (const malla of modelo.mallas) {
            malla.geometry.dispose();
            malla.material.map?.dispose();
            malla.material.dispose();
        }
    }, [modelo]);

    useEffect(() => {
        if (modelo) alCargar(modelo.mallas.map((m) => m.userData.prenda).filter(Boolean));
    }, [modelo, alCargar]);

    const alturaActual = altura ?? modelo?.base ?? 166;

    const terminar = () => {
        try { localStorage.setItem('medidas', JSON.stringify({ sexo, altura: alturaActual, complexion })); } catch { /* sin almacenamiento: se vuelven a pedir */ }
        setAjustando(false);
    };

    useEffect(() => {
        if (!modelo) return;
        const influencias = formas(alturaActual, complexion, modelo);
        // El pelo lleva las mismas formas que el cuerpo, para seguirlo
        for (const malla of modelo.mallas) {
            for (const [nombre, valor] of Object.entries(influencias)) malla.morphTargetInfluences[malla.morphTargetDictionary[nombre]] = valor;
        }
        pintar.current();
    }, [modelo, alturaActual, complexion]);

    useEffect(() => {
        if (!modelo) return;
        let cancelado = false;
        (async () => {
            for (const malla of modelo.mallas) {
                const prenda = prendas[malla.userData.prenda];
                // Solo se rehace la textura si cambia la prenda de esa malla (el objeto se crea de nuevo en cada cambio: vale el id)
                if (!prenda || malla.userData.foto === prenda.id) continue;
                const { mapa, proporcion } = await tela(prenda);
                if (cancelado) { mapa.dispose(); return; }
                const uv = envoltura(malla.geometry.attributes.position.array, prenda.referencia, proporcion);
                malla.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                malla.material.map?.dispose();
                malla.material.map = mapa;
                malla.material.needsUpdate = true;
                malla.userData.foto = prenda.id;
            }
            for (const malla of modelo.mallas) {
                if (malla.userData.prenda) malla.visible = Boolean(prendas[malla.userData.prenda]);
                // La piel que queda bajo una prenda puesta no se pinta: si no, asoma por la tela ceñida
                if (malla.userData.bajo) malla.visible = !malla.userData.bajo.some((id) => prendas[id]);
            }
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
