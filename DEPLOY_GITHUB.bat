@echo off
REM ===============================================
REM Script de Deploy - GitHub + Render
REM ===============================================

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     🚀 SCRIPT DE DEPLOY - Dashboard LOGIMAX            ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git não está instalado!
    echo Baixe em: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git detectado
echo.

REM Verificar status do repositório
if not exist ".git" (
    echo ❌ Repositório Git não inicializado!
    echo.
    echo Você precisa:
    echo   1. Criar repositório em: https://github.com/new
    echo   2. Executar primeiro:
    echo      git init
    echo      git remote add origin https://github.com/SEU_USERNAME/logimax-dashboard.git
    echo.
    pause
    exit /b 1
)

echo [1/4] 📦 Adicionando arquivos...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao adicionar arquivos
    pause
    exit /b 1
)
echo ✅ Arquivos adicionados

echo.
echo [2/4] 💾 Fazendo commit...
set /p message="Digite mensagem de commit (padrão: Atualização do dashboard): "
if "%message%"=="" set message=Atualização do dashboard
git commit -m "%message%"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao fazer commit
    pause
    exit /b 1
)
echo ✅ Commit feito

echo.
echo [3/4] 🌐 Fazendo push para GitHub...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao fazer push
    echo Verifique sua conexão com internet e credenciais do GitHub
    pause
    exit /b 1
)
echo ✅ Push completo

echo.
echo [4/4] 📝 Status do repositório...
git status
echo.

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     ✅ DEPLOY NO GITHUB COMPLETO!                     ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 🎉 Próximas etapas:
echo   1. Acesse: https://render.com
echo   2. Crie novo Web Service
echo   3. Conecte seu repositório GitHub
echo   4. Configure como no guia GITHUB_DEPLOY.md
echo   5. Deploy completo!
echo.

echo 🔗 Seu repositório:
git config --get remote.origin.url
echo.

pause
