import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { quitarFondo } from './recorte.js';
import { HUECOS, vestir } from './huecos.js';
import * as almacen from './almacen.js';
import './App.css';

// El 3D pesa (three.js): se descarga aparte para que la página aparezca antes
const Cuerpo = lazy(() => import('./Cuerpo.jsx'));

// Lo que llevas puesto (hueco -> id de la prenda) se recuerda entre visitas
const leerPuestas = () => {
    try { return JSON.parse(localStorage.getItem('puestas')) ?? {}; } catch { return {}; }
};
const conUrl = (prenda) => ({ ...prenda, url: URL.createObjectURL(prenda.imagen) });
// Mismas prendas en los mismos huecos
const iguales = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((hueco) => a[hueco] === b[hueco]);

/** Guarda y devuelve el id. Sin almacenamiento (p. ej. navegación privada) se puede probar igual, pero no queda guardado. */
const guardarEn = (lista, elemento) => lista.guardar(elemento).catch((error) => {
    console.error(error);
    return crypto.randomUUID();
});

export default function App() {
    const [armario, setArmario] = useState([]);
    const [puestas, setPuestas] = useState(leerPuestas);
    const [conjuntos, setConjuntos] = useState([]);
    const [ocasion, setOcasion] = useState('');
    const [estado, setEstado] = useState('');
    const [ocupado, setOcupado] = useState(false);
    // Las mallas de prenda que trae el cuerpo cargado: un hueco sin su malla no se ofrece
    const [mallas, setMallas] = useState([]);
    const huecos = HUECOS.filter((hueco) => mallas.includes(hueco.malla));

    useEffect(() => {
        let cancelado = false;
        Promise.all([almacen.prendas.todas(), almacen.conjuntos.todas()]).then(
            ([guardadas, ocasiones]) => {
                if (cancelado) return;
                setArmario(guardadas.map(conUrl));
                setConjuntos(ocasiones);
            },
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
            const id = await guardarEn(almacen.prendas, prenda);
            setArmario((antes) => [...antes, conUrl({ ...prenda, id })]);
            setPuestas((antes) => vestir(antes, hueco, id));
            setEstado('');
        } catch (error) {
            // El error del navegador es técnico y en inglés: va a la consola, y en pantalla solo qué hacer
            console.error(error);
            setEstado('No se ha podido preparar la foto. Prueba con otra en la que salga la prenda entera y sola, sin nadie puesto.');
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
        almacen.prendas.borrar(prenda.id).catch(console.error);
        URL.revokeObjectURL(prenda.url);
        setArmario((antes) => antes.filter((p) => p !== prenda));
        setPuestas((antes) => Object.fromEntries(Object.entries(antes).filter(([, id]) => id !== prenda.id)));
    };

    const guardarConjunto = async (evento) => {
        evento.preventDefault();
        const conjunto = { nombre: ocasion.trim(), puestas };
        const id = await guardarEn(almacen.conjuntos, conjunto);
        setConjuntos((antes) => [...antes, { ...conjunto, id }]);
        setOcasion('');
    };

    // Solo las prendas que sigan en el armario: alguna puede haberse borrado después
    const ponerConjunto = (conjunto) => setPuestas(
        Object.fromEntries(Object.entries(conjunto.puestas).filter(([, id]) => armario.some((p) => p.id === id)))
    );

    const tirarConjunto = (conjunto) => {
        if (!confirm(`¿Borrar el conjunto «${conjunto.nombre}»?`)) return;
        almacen.conjuntos.borrar(conjunto.id).catch(console.error);
        setConjuntos((antes) => antes.filter((c) => c !== conjunto));
    };

    // Lo que lleva puesto el maniquí, por malla del catálogo, con la franja donde se midió cada foto
    const vestido = useMemo(() => Object.fromEntries(HUECOS.flatMap(({ id, malla, referencia }) => {
        const prenda = mallas.includes(malla) && armario.find((p) => p.id === puestas[id]);
        return prenda ? [[malla, { ...prenda, referencia }]] : [];
    })), [armario, puestas, mallas]);
    const llevasAlgo = Object.keys(vestido).length > 0;

    return (
        <main>
            <h1>Armario</h1>
            <p className="intro">
                Haz una foto a una prenda extendida sobre un fondo liso, o usa la foto de la tienda en la que
                sale la prenda sola, sin modelo (en Zara suele ser la última).
            </p>

            <Suspense fallback={<p className="estado">Cargando el maniquí…</p>}>
                <Cuerpo prendas={vestido} alCargar={setMallas} />
            </Suspense>

            <p role="status" className="estado">{estado}</p>

            <div className="botones">
                {huecos.map((hueco) => (
                    <label key={hueco.id} className={ocupado ? 'boton inactivo' : 'boton'}>
                        {hueco.nombre}
                        <input
                            type="file"
                            accept="image/*"
                            disabled={ocupado}
                            onChange={(e) => { poner(hueco, e.target.files[0]); e.target.value = ''; }}
                        />
                    </label>
                ))}
            </div>

            {llevasAlgo && (
                <form className="ocasion" onSubmit={guardarConjunto}>
                    <label htmlFor="ocasion">Guardar lo que llevas</label>
                    <div>
                        <input id="ocasion" value={ocasion} onChange={(e) => setOcasion(e.target.value)} placeholder="Cena de Laura" required />
                        <button className="boton">Guardar</button>
                    </div>
                </form>
            )}

            {conjuntos.length > 0 && (
                <section className="armario" aria-label="Tus conjuntos">
                    <h2>Tus conjuntos</h2>
                    <ul className="conjuntos">
                        {conjuntos.map((conjunto) => (
                            <li key={conjunto.id}>
                                <button className="conjunto" aria-pressed={iguales(conjunto.puestas, puestas)} onClick={() => ponerConjunto(conjunto)}>
                                    {conjunto.nombre}
                                </button>
                                <button className="tirar" aria-label={`Borrar el conjunto ${conjunto.nombre}`} onClick={() => tirarConjunto(conjunto)}>×</button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {armario.some((p) => huecos.some((h) => h.id === p.hueco)) && (
                <section className="armario" aria-label="Tu armario">
                    <h2>Tu armario</h2>
                    {huecos.map((hueco) => {
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

        </main>
    );
}
