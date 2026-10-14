import { useEffect, useState } from 'react';
import { quitarFondo } from './recorte.js';
import { HUECOS, vestir } from './huecos.js';
import { todas, guardar, borrar } from './almacen.js';
import './App.css';

// Lo que llevas puesto (hueco -> id de la prenda) se recuerda entre visitas
const leerPuestas = () => {
    try { return JSON.parse(localStorage.getItem('puestas')) ?? {}; } catch { return {}; }
};
const conUrl = (prenda) => ({ ...prenda, url: URL.createObjectURL(prenda.imagen) });

export default function App() {
    const [armario, setArmario] = useState([]);
    const [puestas, setPuestas] = useState(leerPuestas);
    const [estado, setEstado] = useState('');
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => {
        let cancelado = false;
        todas().then(
            (guardadas) => { if (!cancelado) setArmario(guardadas.map(conUrl)); },
            (error) => { console.error(error); setEstado('No se ha podido abrir tu armario guardado.'); }
        );
        return () => { cancelado = true; };
    }, []);

    useEffect(() => {
        try { localStorage.setItem('puestas', JSON.stringify(puestas)); } catch { /* sin almacenamiento: solo se olvida */ }
    }, [puestas]);

    const poner = async (hueco, foto) => {
        if (!foto) return;
        setOcupado(true);
        try {
            const prenda = { hueco: hueco.id, ...(await quitarFondo(foto, setEstado, hueco.referencia)) };
            let id;
            try {
                id = await guardar(prenda);
            } catch (error) {
                // Sin almacenamiento (p. ej. navegación privada) se puede probar igual, pero no se guarda
                console.error(error);
                id = crypto.randomUUID();
            }
            setArmario((antes) => [...antes, conUrl({ ...prenda, id })]);
            setPuestas((antes) => vestir(antes, hueco, id));
            setEstado('');
        } catch (error) {
            // El error del navegador es técnico y en inglés: va a la consola, y en pantalla solo qué hacer
            console.error(error);
            setEstado('No se ha podido preparar la foto. Prueba con otra, con la prenda entera sobre un fondo liso.');
        }
        setOcupado(false);
    };

    // Tocar una prenda guardada te la pone; si ya la llevas, te la quita
    const alternar = (hueco, prenda) => setPuestas((antes) => {
        if (antes[hueco.id] !== prenda.id) return vestir(antes, hueco, prenda.id);
        const { [hueco.id]: _, ...resto } = antes;
        return resto;
    });

    const tirar = (prenda) => {
        if (!confirm('¿Borrar esta prenda de tu armario?')) return;
        borrar(prenda.id).catch(console.error);
        URL.revokeObjectURL(prenda.url);
        setArmario((antes) => antes.filter((p) => p !== prenda));
        setPuestas((antes) => Object.fromEntries(Object.entries(antes).filter(([, id]) => id !== prenda.id)));
    };

    return (
        <main>
            <h1>Armario</h1>
            <p className="intro">Haz una foto a una prenda sobre un fondo liso y pruébala en el maniquí.</p>

            <div className="maniqui">
                <svg viewBox="0 0 100 200" aria-hidden="true">
                    <circle cx="50" cy="16" r="11" />
                    <path d="M44 27h12v6l18 5 8 46-9 2-6-30v36H33V56l-6 30-9-2 8-46 18-5z" />
                    <path d="M33 90h34l3 104H54l-4-78-4 78H30z" />
                </svg>
                {/* La de abajo va primero para que la de arriba quede por encima, como una camiseta por fuera */}
                {[...HUECOS].reverse().map(({ id, nombre, ancho, alto }) => {
                    const prenda = armario.find((p) => p.id === puestas[id]);
                    if (!prenda) return null;
                    const anchoImagen = ancho / prenda.ancho;
                    return (
                        <img
                            key={id}
                            src={prenda.url}
                            alt={nombre}
                            className="prenda"
                            // El centro del cuerpo de la prenda, no el de la foto, va al centro del maniquí
                            style={{ width: `${anchoImagen}%`, top: `${alto}%`, left: `${50 - prenda.centro * anchoImagen}%` }}
                        />
                    );
                })}
            </div>

            <p role="status" className="estado">{estado}</p>

            <div className="botones">
                {HUECOS.map((hueco) => (
                    <label key={hueco.id} className={ocupado ? 'boton inactivo' : 'boton'}>
                        {hueco.nombre}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={ocupado}
                            onChange={(e) => { poner(hueco, e.target.files[0]); e.target.value = ''; }}
                        />
                    </label>
                ))}
            </div>

            {armario.length > 0 && (
                <section className="armario" aria-label="Tu armario">
                    <h2>Tu armario</h2>
                    {HUECOS.map((hueco) => {
                        const guardadas = armario.filter((p) => p.hueco === hueco.id);
                        if (guardadas.length === 0) return null;
                        return (
                            <div key={hueco.id}>
                                <h3>{hueco.nombre}</h3>
                                <ul>
                                    {guardadas.map((prenda) => (
                                        <li key={prenda.id}>
                                            <button className="miniatura" aria-pressed={puestas[hueco.id] === prenda.id} onClick={() => alternar(hueco, prenda)}>
                                                <img src={prenda.url} alt={hueco.nombre} />
                                            </button>
                                            <button className="tirar" aria-label="Borrar del armario" onClick={() => tirar(prenda)}>×</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </section>
            )}

            <a href="#cuerpo" className="enlace-cuerpo">Probar el maniquí en 3D</a>
        </main>
    );
}
