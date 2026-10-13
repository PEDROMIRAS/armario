import { useState } from 'react';
import { quitarFondo } from './recorte.js';
import './App.css';

const HUECOS = [
    { id: 'arriba', nombre: 'Parte de arriba' },
    { id: 'abajo', nombre: 'Parte de abajo' },
];

export default function App() {
    const [prendas, setPrendas] = useState({});
    const [estado, setEstado] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const poner = async (hueco, foto) => {
        if (!foto) return;
        setOcupado(true);
        try {
            const url = await quitarFondo(foto, setEstado);
            setPrendas((antes) => {
                if (antes[hueco]) URL.revokeObjectURL(antes[hueco]);
                return { ...antes, [hueco]: url };
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
                {[...HUECOS].reverse().map(({ id, nombre }) => prendas[id] && (
                    <img key={id} src={prendas[id]} alt={nombre} className={`prenda ${id}`} />
                ))}
            </div>

            <p role="status" className="estado">{estado}</p>

            <div className="botones">
                {HUECOS.map(({ id, nombre }) => (
                    <label key={id} className={ocupado ? 'boton inactivo' : 'boton'}>
                        {nombre}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={ocupado}
                            onChange={(e) => { poner(id, e.target.files[0]); e.target.value = ''; }}
                        />
                    </label>
                ))}
            </div>
        </main>
    );
}
