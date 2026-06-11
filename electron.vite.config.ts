import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import type { Plugin } from 'vite'

// W trybie dev Vite i React Fast Refresh wstrzykują skrypty inline oraz łączą się
// po WebSockecie, więc index.html zawiera poluzowane CSP. W buildzie produkcyjnym
// żaden kod inline nie jest potrzebny — ten plugin zaostrza politykę.
function strictCspOnBuild(): Plugin {
  return {
    name: 'strict-csp-on-build',
    apply: 'build',
    transformIndexHtml(html) {
      const hardened = html
        .replace("script-src 'self' 'unsafe-inline'", "script-src 'self'")
        .replace(' ws://localhost:*', '')
      // Podmiana po literalnym stringu — przy zmianie meta CSP build ma
      // wybuchnąć, a nie po cichu wypuścić produkcję z poluzowaną polityką.
      // Walidujemy samą zawartość atrybutu content (komentarze HTML wokół
      // meta też wspominają o ws://localhost).
      const metaTag = hardened.match(/<meta[^>]*Content-Security-Policy[^>]*>/i)?.[0] ?? ''
      const csp = metaTag.match(/content="([^"]*)"/i)?.[1] ?? ''
      if (!csp || /script-src[^;]*'unsafe-inline'/.test(csp) || csp.includes('ws://localhost')) {
        throw new Error(
          'strict-csp-on-build: nie udało się zaostrzyć CSP — zsynchronizuj plugin z meta CSP w src/renderer/index.html'
        )
      }
      return hardened
    }
  }
}

export default defineConfig({
  main: {
    // youtubei.js publikuje dla Node wyłącznie ESM, a proces główny budujemy jako
    // CJS — bundlujemy ją więc zamiast zostawiać require() w runtime.
    plugins: [externalizeDepsPlugin({ exclude: ['youtubei.js'] })],
    resolve: {
      alias: { '@shared': resolve(__dirname, 'src/shared') }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve(__dirname, 'src/shared') }
    }
  },
  renderer: {
    plugins: [react(), strictCspOnBuild()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
        '@': resolve(__dirname, 'src/renderer/src')
      }
    }
  }
})
