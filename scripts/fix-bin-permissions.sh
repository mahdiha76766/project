#!/bin/bash
# Run on server after upload: bash scripts/fix-bin-permissions.sh
cd "$(dirname "$0")/.." || exit 1
if [ -d node_modules/.bin ]; then
  chmod +x node_modules/.bin/*
  echo "Fixed permissions on node_modules/.bin"
fi
find node_modules/@next/swc-* -type f -name "*.node" 2>/dev/null | head -5
echo "Done."
