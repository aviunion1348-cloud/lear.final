@echo off
REM ===========================================================================
REM  LEAR - double-click installer for Windows
REM  Downloads learfinal.zip, installs both halves, launches the console.
REM ===========================================================================
title Lear - Installer
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://github.com/aviunion1348-cloud/lear.final/raw/arena/01a0ec0b-lear-final/install.ps1 | iex"
echo.
pause
