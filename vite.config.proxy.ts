// Configuration du proxy Vite pour rediriger les appels API frontend vers le backend Node.js en dev
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
}
