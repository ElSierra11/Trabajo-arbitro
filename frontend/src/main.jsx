import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar Service Worker para PWA (offline support & auto-update)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('PWA: Service Worker registrado con éxito:', reg.scope);
        // Force update check
        reg.update();
      })
      .catch(err => console.error('PWA: Error al registrar el Service Worker:', err));
  });
}
