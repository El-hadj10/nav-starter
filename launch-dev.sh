#!/usr/bin/env bash
# launch-dev.sh — démarre backend (Express :4000) + frontend (Vite :5173)
# puis ouvre le navigateur. Ctrl+C arrête tout proprement.
#
# Usage :
#   ./launch-dev.sh            # démarrage complet + navigateur
#   NO_BROWSER=1 ./launch-dev.sh  # sans ouvrir le navigateur (CI, usage distant)
set -u

cd "$(dirname "$0")"

BACKEND_PORT=4000
FRONTEND_URL="http://localhost:5173/nav-starter/"
HEALTH_URL="http://localhost:${BACKEND_PORT}/health"
VITE_URL="http://localhost:5173/nav-starter/"

BACKEND_PID=""
FRONTEND_PID=""
CLEANED=0

cleanup() {
  [ "$CLEANED" = "1" ] && return
  CLEANED=1
  echo ""
  echo "Arrêt des serveurs..."
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo "Serveurs arrêtés. Au revoir."
}
trap cleanup EXIT INT TERM

echo "=== nav-starter — lancement développement ==="

# 1. Dépendances (première exécution uniquement)
if [ ! -d node_modules ]; then
  echo "node_modules absent — installation des dépendances (1-2 min)..."
  npm install || { echo "❌ Échec de npm install"; exit 1; }
fi

# 2. Backend
if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
  echo "✅ Backend déjà en cours sur :${BACKEND_PORT} — réutilisé."
else
  if [ ! -f backend/.env ]; then
    echo "ℹ️  backend/.env absent — copie depuis .env.example (comptes démo par défaut)."
    cp backend/.env.example backend/.env 2>/dev/null
  fi
  echo "Démarrage backend (port ${BACKEND_PORT})..."
  node backend/index.js &
  BACKEND_PID=$!
  for _ in $(seq 1 20); do
    curl -sf "$HEALTH_URL" > /dev/null 2>&1 && break
    sleep 0.3
  done
  if ! curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    echo "❌ Le backend n'a pas répondu sur :${BACKEND_PORT}."
    echo "   Vérifie le port et backend/.env, puis relance."
    exit 1
  fi
  echo "✅ Backend OK — http://localhost:${BACKEND_PORT}"
fi

# 3. Frontend (Vite)
if curl -sf "$VITE_URL" > /dev/null 2>&1; then
  echo "✅ Frontend déjà en cours sur :5173 — réutilisé."
else
  echo "Démarrage frontend (Vite)..."
  npx vite --port 5173 --strictPort &
  FRONTEND_PID=$!
  for _ in $(seq 1 30); do
    curl -sf "$VITE_URL" > /dev/null 2>&1 && break
    sleep 0.3
  done
  if ! curl -sf "$VITE_URL" > /dev/null 2>&1; then
    echo "❌ Le frontend n'a pas démarré sur :5173."
    exit 1
  fi
  echo "✅ Frontend OK — ${FRONTEND_URL}"
fi

# 4. Navigateur
if [ "${NO_BROWSER:-0}" = "1" ]; then
  echo "NO_BROWSER=1 — navigateur non ouvert."
else
  echo "Ouverture du navigateur : ${FRONTEND_URL}"
  xdg-open "$FRONTEND_URL" 2>/dev/null || echo "⚠️  Ouvre manuellement : ${FRONTEND_URL}"
fi

echo ""
echo "=== Développement prêt — Ctrl+C pour tout arrêter ==="

# Maintient le script en vie tant que les serveurs tournent
if [ -n "$FRONTEND_PID" ] || [ -n "$BACKEND_PID" ]; then
  wait
else
  echo "Les deux serveurs tournaient déjà — rien à surveiller, le script se termine."
fi
