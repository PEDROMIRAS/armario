import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { quitarFondo } from './recorte.js';
import { HUECOS, vestir, formaDe } from './huecos.js';
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
    const menu = useRef(null);
    // Las formas 3D que tiene el cuerpo cargado ({id, hueco, nombre}): un hueco sin ninguna no se ofrece
    const [catalogo, setCatalogo] = useState([]);
    const huecos = HUECOS.filter((hueco) => catalogo.some((forma) => forma.hueco === hueco.id));

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

    const poner = async (hueco, forma, foto) => {
        if (!foto) return;
        setOcupado(true);
        try {
            const prenda = { hueco: hueco.id, forma: forma.id, ...(await quitarFondo(foto, setEstado, hueco.referencia)) };
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

    // Lo que lleva puesto el maniquí, por hueco: la foto, la forma 3D con la que se ve y la franja donde se midió
    const vestido = useMemo(() => Object.fromEntries(HUECOS.flatMap(({ id, referencia }) => {
        const prenda = armario.find((p) => p.id === puestas[id]);
        const forma = prenda && formaDe(prenda, catalogo);
        return forma ? [[id, { ...prenda, forma, referencia }]] : [];
    })), [armario, puestas, catalogo]);
    const llevasAlgo = Object.keys(vestido).length > 0;

    return (
        <main>
            <h1>Armario</h1>
            <p className="intro">
                Haz una foto a una prenda extendida sobre un fondo liso, o usa la foto de la tienda en la que
                sale la prenda sola, sin modelo (en Zara suele ser la última).
            </p>

            <Suspense fallback={<p className="estado">Cargando el maniquí…</p>}>
                <Cuerpo prendas={vestido} alCargar={setCatalogo} />
            </Suspense>

            <p role="status" className="estado">{estado}</p>

            {/* Un solo botón que despliega los tipos de prenda; cada tipo abre la cámara o la galería */}
            <details className="anadir" ref={menu}>
                <summary className={ocupado ? 'boton inactivo' : 'boton'} onClick={(e) => { if (ocupado) e.preventDefault(); }}>
                    {ocupado ? 'Preparando la prenda…' : 'Añadir prenda'}
                </summary>
                <div className="tipos">
                    {huecos.map((hueco) => (
                        <fieldset key={hueco.id}>
                            <legend>{hueco.nombre}</legend>
                            {catalogo.filter((forma) => forma.hueco === hueco.id).map((forma) => (
                                <label key={forma.id}>
                                    {forma.nombre}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={ocupado}
                                        onChange={(e) => { menu.current.open = false; poner(hueco, forma, e.target.files[0]); e.target.value = ''; }}
                                    />
                                </label>
                            ))}
                        </fieldset>
                    ))}
                </div>
            </details>

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
