#!/bin/bash
# Push to GitHub
# Run after creating a repo at https://github.com/new
# Usage: ./scripts/push-to-github.sh <github-username>

set -e

USERNAME="${1:-songpark95}"
REPO="craftly"

echo "→ Adding remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${USERNAME}/${REPO}.git"

echo "→ Pushing to GitHub..."
git push -u origin main

echo "✓ Done! https://github.com/${USERNAME}/${REPO}"
