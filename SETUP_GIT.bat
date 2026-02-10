@echo off
REM ===============================================
REM Setup Git - Dashboard LOGIMAX
REM ===============================================

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     🔧 CONFIGURAÇÃO INICIAL GIT - Dashboard LOGIMAX    ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar Git
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git não está instalado!
    echo.
    echo Baixe e instale em: https://git-scm.com/
    echo.
    echo Depois execute este script novamente!
    pause
    exit /b 1
)

echo ✅ Git detectado
echo.

REM Criar .gitignore se não existir
if not exist ".gitignore" (
    echo [1/4] Criando .gitignore...
    (
        echo __pycache__/
        echo *.pyc
        echo .env
        echo venv/
        echo *.log
    ) > .gitignore
    echo ✅ .gitignore criado
) else (
    echo [1/4] .gitignore já existe ✅
)

echo.
echo [2/4] Inicializando Git...
if not exist ".git" (
    git init
    echo ✅ Repositório Git inicializado
) else (
    echo ✅ Repositório Git já existe
)

echo.
echo [3/4] Verificando arquivos importantes...
setlocal enabledelayedexpansion
set /a missing=0

for %%F in (app.py requirements.txt Procfile templates\index.html) do (
    if not exist "%%F" (
        echo ❌ Arquivo faltando: %%F
        set /a missing=!missing!+1
    ) else (
        echo ✅ %%F
    )
)

if %missing% GTR 0 (
    echo.
    echo ⚠️  Arquivos importantes faltando!
    pause
    exit /b 1
)

echo.
echo [4/4] Configurando Git...
git config user.email "dashboard@logimax.local" 2>nul
git config user.name "LOGIMAX Dashboard" 2>nul
echo ✅ Configuração completa

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     ✅ SETUP GIT CONCLUÍDO!                            ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 📋 Próximos passos:
echo.
echo 1️⃣  Crie repositório no GitHub:
echo    Acesse: https://github.com/new
echo    Nome: logimax-dashboard
echo    Deixe PUBLIC
echo    Clique em Create
echo.
echo 2️⃣  Copie a URL do repositório
echo.
echo 3️⃣  Execute este comando:
echo    git remote add origin [URL_COPIADA]
echo.
echo 4️⃣  Depois execute:
echo    git add .
echo    git commit -m "Dashboard LOGIMAX v2.0"
echo    git branch -M main
echo    git push -u origin main
echo.
echo OU duplo clique em: DEPLOY_GITHUB.bat
echo.

pause
