#!/bin/bash

# ──────────────────────────────────────────────────────────────
#  Apollo — A system for augmented knowledge work
# ──────────────────────────────────────────────────────────────

set -e

# Colors
BOLD='\033[1m'
DIM='\033[2m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo -e "${BLUE}${BOLD}  ╭──────────────────────────────────────────╮${RESET}"
echo -e "${BLUE}${BOLD}  │                                          │${RESET}"
echo -e "${BLUE}${BOLD}  │       ${CYAN}🌍  A P O L L O${BLUE}                    │${RESET}"
echo -e "${BLUE}${BOLD}  │       ${DIM}augmented knowledge work${RESET}${BLUE}${BOLD}          │${RESET}"
echo -e "${BLUE}${BOLD}  │                                          │${RESET}"
echo -e "${BLUE}${BOLD}  ╰──────────────────────────────────────────╯${RESET}"
echo ""

# ── Preflight checks ────────────────────────────────────────

echo -e "${DIM}Running preflight checks...${RESET}"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "  ${RED}✗${RESET} Node.js not found"
  echo ""
  echo -e "  Apollo needs Node.js 18 or later to run."
  echo -e "  Install it from ${CYAN}https://nodejs.org${RESET} or via your package manager."
  echo ""
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ] 2>/dev/null; then
  echo -e "  ${YELLOW}⚠${RESET}  Node.js $(node -v) detected — Apollo works best with v18+"
  echo -e "     Consider upgrading: ${CYAN}https://nodejs.org${RESET}"
  echo ""
else
  echo -e "  ${GREEN}✓${RESET} Node.js $(node -v)"
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo -e "  ${RED}✗${RESET} npm not found"
  echo ""
  echo -e "  npm usually ships with Node.js. Try reinstalling Node."
  echo ""
  exit 1
else
  echo -e "  ${GREEN}✓${RESET} npm $(npm -v)"
fi

echo ""

# ── Install dependencies ─────────────────────────────────────

if [ ! -d "node_modules" ]; then
  echo -e "${BOLD}Installing dependencies...${RESET}"
  echo -e "${DIM}First launch takes a moment — making sure everything is in place.${RESET}"
  echo ""
  npm install
  echo ""
  echo -e "  ${GREEN}✓${RESET} Dependencies installed"
  echo ""
else
  echo -e "  ${GREEN}✓${RESET} Dependencies already installed"
  echo -e "  ${DIM}(Run ${RESET}npm install${DIM} manually if you need to update them)${RESET}"
  echo ""
fi

# ── Check for config ──────────────────────────────────────────

if [ ! -f "data/config.json" ]; then
  echo -e "  ${YELLOW}⚠${RESET}  No ${BOLD}data/config.json${RESET} found"
  echo -e "     Apollo will start, but integrations (Slack, Jira, Figma, etc.)"
  echo -e "     won't be connected. Copy the example to get started:"
  echo ""
  echo -e "     ${DIM}cp examples/config.example.json data/config.json${RESET}"
  echo ""
fi

# ── Launch ────────────────────────────────────────────────────

PORT=${PORT:-1225}

echo -e "${BOLD}Launching Apollo...${RESET}"
echo ""
echo -e "  ${DIM}Local:${RESET}   ${CYAN}${BOLD}http://localhost:${PORT}${RESET}"
echo ""
echo -e "  ${DIM}Press ${BOLD}Ctrl+C${RESET}${DIM} to stop${RESET}"
echo ""
echo -e "${DIM}────────────────────────────────────────────────${RESET}"
echo ""

# Run with --silent to suppress npm boilerplate output.
# The dev script uses concurrently --raw to remove [0]/[1] prefixes.
# Webpack and the server are configured to only log errors and warnings.
npm run dev --silent
