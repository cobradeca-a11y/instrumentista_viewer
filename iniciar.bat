@echo off
echo === Instrumentistas — Iniciando servidor de desenvolvimento ===
echo.

:: Verifica se node_modules existe
if not exist "node_modules\" (
    echo [1/2] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias.
        pause
        exit /b 1
    )
    echo Dependencias instaladas com sucesso!
    echo.
)

:: Roda vite diretamente via npx para garantir que funcione no Windows
echo [2/2] Iniciando servidor Vite...
echo Acesse: http://localhost:5173
echo.
call npx vite
pause
