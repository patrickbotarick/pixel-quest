@echo off
setlocal
cd /d "%~dp0game"
if errorlevel 1 goto erro
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node.js 22.12 ou superior.
  goto erro
)
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major>22 || (major===22 && minor>=12) ? 0 : 1)"
if errorlevel 1 (
  echo Este jogo requer Node.js 22.12 ou superior.
  goto erro
)
where npm >nul 2>nul
if errorlevel 1 goto erro
node scripts\ensure-dependencies.mjs
if errorlevel 1 goto erro
echo.
node scripts\local-addresses.mjs
echo Use apenas uma rede local confiavel. Ctrl+C encerra o servidor.
echo.
call npm run dev
if errorlevel 1 goto erro
exit /b 0
:erro
echo.
echo Nao foi possivel iniciar o Pixel Quest. Confira a mensagem acima.
pause
exit /b 1
