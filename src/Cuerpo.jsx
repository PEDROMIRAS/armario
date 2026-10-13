import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './Cuerpo.css';

// Cada control mezcla una de dos formas del modelo (ver modelos/cuerpo.py): por debajo de `medio`
// la forma `menos`, por encima la forma `mas`. `tramo` es cuánto hay que alejarse del medio para
// aplicar la forma entera.
const CONTROLES = [
    // El cuerpo medio mide 166 cm; sus formas extremas, 130 y 237. Se limita a alturas de persona.
    { id: 'altura', nombre: 'Altura', unidad: ' cm', min: 145, max: 205, paso: 1, medio: 166, menos: 'bajo', tramoMenos: 36, mas: 'alto', tramoMas: 71 },
    { id: 'complexion', nombre: 'Complexión', min: -1, max: 1, paso: 0.01, medio: 0, menos: 'delgado', tramoMenos: 1, mas: 'corpulento', tramoMas: 1 },
    { id: 'proporcion', nombre: 'Hombros y cadera', min: -1, max: 1, paso: 0.01, medio: 0, menos: 'femenino', tramoMenos: 1, mas: 'masculino', tramoMas: 1 },
];
const MEDIO = Object.fromEntries(CONTROLES.map((c) => [c.id, c.medio]));

export default function Cuerpo() {
    const lienzo = useRef(null);
    const malla = useRef(null);
    const pintar = useRef(() => {});
    const [medidas, setMedidas] = useState(MEDIO);
    const [estado, setEstado] = useState('Cargando el cuerpo…');

    useEffect(() => {
        const canvas = lienzo.current;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const escena = new THREE.Scene();
        const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        camara.position.set(0, 1.02, 4.5);
        escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8478, 2.2));
        const foco = new THREE.DirectionalLight(0xffffff, 1.6);
        foco.position.set(1.5, 3, 2.5);
        escena.add(foco);

        const controles = new OrbitControls(camara, canvas);
        controles.target.set(0, 1.02, 0);
        controles.enablePan = false;
        controles.enableZoom = false;
        // Solo gira alrededor del cuerpo: verlo desde arriba o desde abajo no aporta nada
        controles.minPolarAngle = controles.maxPolarAngle = Math.PI / 2;
        controles.update();

        // Se pinta solo cuando algo cambia, no en cada fotograma: ahorra batería en el móvil
        pintar.current = () => renderer.render(escena, camara);
        controles.addEventListener('change', pintar.current);

        const ajustar = () => {
            const { clientWidth: ancho, clientHeight: alto } = canvas;
            renderer.setSize(ancho, alto, false);
            camara.aspect = ancho / alto;
            camara.updateProjectionMatrix();
            pintar.current();
        };
        const observador = new ResizeObserver(ajustar);
        observador.observe(canvas);

        let cancelado = false;
        new GLTFLoader().load(
            `${import.meta.env.BASE_URL}modelos/cuerpo.glb`,
            (gltf) => {
                if (cancelado) return;
                gltf.scene.traverse((objeto) => {
                    if (!objeto.isMesh) return;
                    objeto.material = new THREE.MeshStandardMaterial({ color: 0xc9c2b8, roughness: 0.85 });
                    malla.current = objeto;
                });
                escena.add(gltf.scene);
                setEstado('');
                pintar.current();
            },
            undefined,
            () => setEstado('No se ha podido cargar el cuerpo.')
        );

        return () => {
            cancelado = true;
            observador.disconnect();
            controles.dispose();
            renderer.dispose();
            malla.current = null;
        };
    }, []);

    useEffect(() => {
        const m = malla.current;
        if (!m) return;
        for (const c of CONTROLES) {
            const desvio = medidas[c.id] - c.medio;
            m.morphTargetInfluences[m.morphTargetDictionary[c.menos]] = Math.max(0, -desvio / c.tramoMenos);
            m.morphTargetInfluences[m.morphTargetDictionary[c.mas]] = Math.max(0, desvio / c.tramoMas);
        }
        pintar.current();
    }, [medidas, estado]);

    return (
        <main className="cuerpo">
            <h1>Tu maniquí</h1>
            <canvas ref={lienzo} aria-label="Maniquí en 3D. Arrastra para girarlo." role="img" />
            <p role="status" className="estado">{estado}</p>
            {CONTROLES.map(({ id, nombre, unidad, min, max, paso }) => (
                <label key={id}>
                    {nombre}{unidad && `: ${medidas[id]}${unidad}`}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={paso}
                        value={medidas[id]}
                        onChange={(e) => setMedidas({ ...medidas, [id]: Number(e.target.value) })}
                    />
                </label>
            ))}
            <button onClick={() => setMedidas(MEDIO)}>Volver al cuerpo medio</button>
            <a href="#">Volver a la prueba de fotos</a>
        </main>
    );
}
