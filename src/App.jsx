import { useState } from 'react';
import { quitarFondo } from './recorte.js';
import { HUECOS, vestir } from './huecos.js';
import './App.css';

export default function App() {
    const [prendas, setPrendas] = useState({});
    const [estado, setEstado] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const poner = async (hueco, foto) => {
        if (!foto) return;
        setOcupado(true);
        try {
            const prenda = await quitarFondo(foto, setEstado, hueco.referencia);
            setPrendas((antes) => {
                const nuevas = vestir(antes, hueco, prenda);
                // Las que se quitan sueltan su imagen
                for (const id in antes) if (nuevas[id] !== antes[id]) URL.revokeObjectURL(antes[id].url);
                return nuevas;
            });
            setEstado('');
        } catch (error) {
            // El error del navegador es técnico y en inglés: va a la consola, y en pantalla solo qué hacer
            console.error(error);
            setEstado('No se ha podido preparar la foto. Prueba con otra, con la prenda entera sobre un fondo liso.');
        }
        setOcupado(false);
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
                    const prenda = prendas[id];
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
            <a href="#cuerpo" className="enlace-cuerpo">Probar el maniquí en 3D</a>
        </main>
    );
}
