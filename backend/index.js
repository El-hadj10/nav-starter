// Backend minimal Node.js pour proxy carto/routing
// Utilise Express, à compléter avec la logique proxy et gestion de clé API

const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Exemple: Proxy pour géocodage (à adapter selon le fournisseur choisi)
app.get('/api/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  // Remplacer l’URL ci-dessous par celle du fournisseur pro
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${process.env.MAPBOX_TOKEN}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

// Exemple: Proxy pour routing (à adapter selon le fournisseur choisi)
app.get('/api/route', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Missing from/to' });
  // Remplacer l’URL ci-dessous par celle du fournisseur pro
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from};${to}?access_token=${process.env.MAPBOX_TOKEN}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Routing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
