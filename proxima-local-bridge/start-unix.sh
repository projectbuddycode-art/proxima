#!/usr/bin/env bash
echo "===================================================="
echo "🚀 STARTING PROXIMA LOCAL AI BRIDGE (UNIX/MACOS)"
echo "===================================================="

if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "Ollama local engine is not running. Starting Ollama serve..."
    ollama serve &
    sleep 3
else
    echo "✅ Ollama local engine is running."
fi

echo "Starting Proxima Local Bridge service..."
node index.mjs
