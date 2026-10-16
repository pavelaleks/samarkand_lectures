#!/usr/bin/env bash
# Клонирует официальный репозиторий Natasha рядом с учебной папкой
set -euo pipefail
TARGET="$(cd "$(dirname "$0")/.." && pwd)/natasha_upstream"
if [[ -d "$TARGET/.git" ]]; then
  echo "Уже есть: $TARGET"
  git -C "$TARGET" pull --ff-only || true
else
  git clone https://github.com/natasha/natasha.git "$TARGET"
fi
echo "OK → $TARGET"
echo "Документация: https://natasha.github.io"
echo "Установка: cd \"$TARGET\" && python -m pip install -e ."
