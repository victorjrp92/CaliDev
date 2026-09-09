#!/usr/bin/env bash
# Corre los seis oráculos. Sale distinto de 0 si alguno falla.
# Uso: BASE=http://localhost:3000 scripts/oraculos/correr.sh
set -uo pipefail
cd "$(dirname "$0")/../.."
fallos=0
for o in contraste barra-viva paridad-i18n render enlaces anclas barra-tapa alcanzabilidad; do
  echo ""
  echo "──────── $o ────────"
  node "scripts/oraculos/$o.mjs" || { echo "↑ $o FALLÓ"; fallos=$((fallos + 1)); }
done
echo ""
if [ "$fallos" -eq 0 ]; then echo "✓ los ocho oráculos pasan"; else echo "✗ $fallos oráculo(s) fallando"; fi
exit "$fallos"
