import { StrictMode, lazy, Suspense, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// El 3D pesa: solo se descarga al entrar en esa pantalla
const Cuerpo = lazy(() => import('./Cuerpo.jsx'))
const alCambiar = (aviso) => { window.addEventListener('hashchange', aviso); return () => window.removeEventListener('hashchange', aviso) }

// Dos pantallas de prueba, elegidas por la parte #... de la dirección. La de fotos solo se oculta,
// para no perder lo que llevas puesto al ir al 3D y volver.
function Pantalla() {
  const enCuerpo = useSyncExternalStore(alCambiar, () => window.location.hash) === '#cuerpo'
  return (
    <>
      <div hidden={enCuerpo}><App /></div>
      {enCuerpo && <Suspense><Cuerpo /></Suspense>}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Pantalla />
  </StrictMode>,
)
