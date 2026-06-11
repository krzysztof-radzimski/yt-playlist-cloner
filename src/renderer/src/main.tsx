import React from 'react'
import { createRoot } from 'react-dom/client'
import { getStrings } from '@shared/i18n'
import App from './App'
import { StringsContext } from './i18n'
import './styles/global.css'

const strings = getStrings(window.api.language)
document.documentElement.lang = strings.lang

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StringsContext.Provider value={strings}>
      <App />
    </StringsContext.Provider>
  </React.StrictMode>
)
