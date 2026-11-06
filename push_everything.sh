#!/usr/bin/env bash
# push_everything.sh
# Pushes the entire Inelec L05 folder to GitHub, including all course materials.
# Run this from the Inelec L05 directory:  bash push_everything.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo "=== Inelec L05 — Push Everything ==="
echo "Working directory: $REPO_DIR"
echo ""

# --- Step 1: Check Git LFS for large files ---
if command -v git-lfs &>/dev/null || command -v git-lfs &>/dev/null; then
    echo "[1/5] Git LFS is available."
    git lfs install 2>/dev/null || true
else
    echo "[1/5] Git LFS not found. Installing..."
    # Try common package managers
    if command -v apt &>/dev/null; then
        sudo apt install -y git-lfs 2>/dev/null && git lfs install
    elif command -v brew &>/dev/null; then
        brew install git-lfs && git lfs install
    else
        echo "  Could not install Git LFS automatically."
        echo "  Large files (>100MB) may fail to push."
    fi
fi

# --- Step 2: Track large files with LFS ---
echo "[2/5] Configuring LFS for large files..."
if command -v git-lfs &>/dev/null; then
    git lfs track "EMF/Examples/coulombs law.mp4" 2>/dev/null || true
    git lfs track "*.mp4" 2>/dev/null || true
    git add .gitattributes 2>/dev/null || true
fi

# --- Step 3: Force-add everything (bypass .gitignore) ---
echo "[3/5] Staging all files (including ignored ones)..."
git add -A -f

# --- Step 4: Commit ---
echo "[4/5] Committing..."
git commit -m "Push all course materials: books, slides, exams, datasheets, EMF" || {
    echo "  Nothing to commit or commit failed."
}

# --- Step 5: Push ---
echo "[5/5] Pushing to origin/main..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Check your repo at: https://github.com/nigwyz/Inelec-L05-Starter-Pack"