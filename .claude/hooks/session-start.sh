#!/bin/bash
set -euo pipefail

# Only run in remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

# Install Node dependencies for the framelight app
cd "${CLAUDE_PROJECT_DIR:-/home/user/Claude-P1}/framelight"
npm install

# Install Playwright browsers if not already cached
if [ ! -f "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome" ]; then
  npx playwright install chromium --with-deps
fi
