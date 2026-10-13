import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { lazy, Suspense, useSyncExternalStore } from 'react'

// El 3D pesa: solo se descarga al entrar en esa pantalla
const Cuerpo = lazy(() => import('./Cuerpo.jsx'))
const alCambiar = (aviso) => { window.addEventListener('hashchange', aviso); return () => window.removeEventListener('hashchange', aviso) }

// Dos pantallas de prueba, elegidas por la parte #... de la dirección
function Pantalla() {
  const ruta = useSyncExternalStore(alCambiar, () => window.location.hash)
  return ruta === '#cuerpo' ? <Suspense><Cuerpo /></Suspense> : <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Pantalla />
  </StrictMode>,
)
