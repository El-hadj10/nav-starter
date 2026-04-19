// Utilitaire pour centraliser la config API (ex : choix du fournisseur, clés, options)
module.exports = {
  provider: 'mapbox',
  mapbox: {
    token: process.env.MAPBOX_TOKEN,
    baseUrl: 'https://api.mapbox.com',
  },
  // Ajouter d’autres fournisseurs ici si besoin
};
