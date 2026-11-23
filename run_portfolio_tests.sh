#!/usr/bin/env bash
# Tests de démonstration reproductibles du portfolio (Linux / macOS / Termux)
set -eu
BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"

printf '\n===== ENVIRONNEMENT =====\n'
printf 'Date : '; date
printf 'Dossier : '; pwd
printf '\n===== PYTHON : CALCULATRICE =====\n'
printf '17\n+\n25\n' | python3 calculatrice.py
printf '\n===== PYTHON : JEU DE DEVINETTES =====\n'
python3 -c "import builtins, runpy, random; random.randint=lambda a,b: 50; builtins.input=lambda prompt='': '50'; runpy.run_path('devinettes.py')"
printf '\n===== PYTHON : GESTIONNAIRE DE NOTES =====\n'
printf '2\nMathématiques\n16\nInformatique\n18\n' | python3 gestionnaire_notes.py

printf '\n===== C : COMPILATION ET EXÉCUTION =====\n'
COMPILER=""
if command -v clang >/dev/null 2>&1; then COMPILER=clang
elif command -v gcc >/dev/null 2>&1; then COMPILER=gcc
else
  echo "Aucun compilateur C détecté. Installe clang (Termux : pkg install clang) ou gcc."
  exit 2
fi
echo "Compilateur : $COMPILER"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
for src in variables-conditions.c boucles-tableaux.c fonctions-pointeurs.c; do
  exe="$TMP_DIR/${src%.c}"
  echo "--- $src ---"
  "$COMPILER" -Wall -Wextra -std=c11 "$src" -o "$exe"
  case "$src" in
    variables-conditions.c) printf '15\n' | "$exe" ;;
    *) "$exe" ;;
  esac
done

printf '\n===== SYSTÈME D’EXPLOITATION / TERMINAL =====\n'
printf '$ pwd\n'; pwd
printf '\n$ ls -la\n'; ls -la | head -20
printf '\n$ uname -a\n'; uname -a
TMP_TEST="$(mktemp -d)"
printf '\n$ printf ... > test.txt\n'
printf 'Portfolio numérique - test terminal OK\n' > "$TMP_TEST/test.txt"
printf '\n$ cat test.txt\n'; cat "$TMP_TEST/test.txt"
printf '\n$ df -h .\n'; df -h .
rm -rf "$TMP_TEST"
printf '\n===== FIN DES TESTS =====\n'
echo 'Les tests ci-dessus sont des démonstrations. Faites vos propres captures d’écran dans Termux.'
