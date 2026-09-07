import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './sayfalar.css'
import './ofis.css'
import './sayfalar2.css'
import './ek.css'
import './toplanti.css'
import './beyin.css'

const kok = document.getElementById('kok')
if (!kok) throw new Error('Kök eleman bulunamadi')

createRoot(kok).render(
  <StrictMode>
    <App />
  </StrictMode>
)
