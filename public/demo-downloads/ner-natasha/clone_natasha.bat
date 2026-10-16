@echo off
set TARGET=%~dp0..\natasha_upstream
if exist "%TARGET%\.git" (
  echo Already cloned: %TARGET%
  git -C "%TARGET%" pull --ff-only
) else (
  git clone https://github.com/natasha/natasha.git "%TARGET%"
)
echo OK - %TARGET%
echo Docs: https://natasha.github.io
