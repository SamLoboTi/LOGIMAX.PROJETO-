@echo off
REM ===============================================
REM Script de Teste - Dashboard LOGIMAX
REM ===============================================

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     🧪 TESTE DO DASHBOARD LOGIMAX                      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Validar ambiente
echo [1/4] 🔍 Validando ambiente Python...
python validar.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erros encontrados na validação!
    pause
    exit /b 1
)

echo.
echo [2/4] 📦 Instalando dependências...
python -m pip install -q Flask Flask-CORS pandas numpy 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)
echo ✅ Dependências OK

echo.
echo [3/4] 🚀 Iniciando servidor Flask...
echo.
echo ══════════════════════════════════════════════════════════
echo ✅ Servidor iniciado com sucesso!
echo.
echo 🌐 Acesse: http://localhost:5000
echo.
echo 📊 Seu dashboard está pronto para visualização:
echo    • KPIs em tempo real
echo    • Gráficos interativos
echo    • Tabelas de dados
echo    • Auto-refresh a cada 60 segundos
echo.
echo 📱 Teste em: Desktop, Tablet e Celular
echo.
echo ⏹️  Pressione Ctrl+C para parar o servidor
echo ══════════════════════════════════════════════════════════
echo.

python app.py

pause
