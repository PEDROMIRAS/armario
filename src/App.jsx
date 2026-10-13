import { useState } from 'react';
import { quitarFondo } from './recorte.js';
import './App.css';

// Cada prenda se escala para que su cuerpo (medido en `referencia`, una franja de la foto) ocupe
// `ancho` del maniquí, y se cuelga desde `alto`. Porcentajes sobre la silueta de 100 x 200.
const HUECOS = [
    { id: 'arriba', nombre: 'Parte de arriba', referencia: [0.75, 0.95], ancho: 40, alto: 14 }, // el bajo, desde los hombros
    { id: 'abajo', nombre: 'Parte de abajo', referencia: [0.02, 0.12], ancho: 37, alto: 44 }, // la cintura
];

export default function App() {
    const [prendas, setPrendas] = useState({});
    const [estado, setEstado] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const poner = async ({ id: hueco, referencia }, foto) => {
        if (!foto) return;
        setOcupado(true);
        try {
            const prenda = await quitarFondo(foto, setEstado, referencia);
            setPrendas((antes) => {
                if (antes[hueco]) URL.revokeObjectURL(antes[hueco].url);
                return { ...antes, [hueco]: prenda };
            });
            setEstado('');
        } catch (error) {
            setEstado(error.message || 'No se ha podido preparar la foto. Prueba con otra.');
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
        </main>
    );
}
