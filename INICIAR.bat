@echo off
REM ===============================================
REM Dashboard LOGIMAX - Script de Inicialização
REM ===============================================

echo.
echo 🚀 Iniciando Dashboard LOGIMAX...
echo.

REM Verificar se está na pasta correta
if not exist "app.py" (
    echo ❌ Erro: app.py não encontrado!
    echo Coloque este script na pasta do projeto
    pause
    exit /b 1
)

REM Verificar CSVs
if not exist "ERP_Pedidos.csv" (
    echo ⚠️  Aviso: ERP_Pedidos.csv não encontrado
)
if not exist "WMS_Estoque.csv" (
    echo ⚠️  Aviso: WMS_Estoque.csv não encontrado
)
if not exist "TMS_Transporte.csv" (
    echo ⚠️  Aviso: TMS_Transporte.csv não encontrado
)

REM Instalar dependências
echo 📦 Instalando dependências...
python -m pip install -q Flask Flask-CORS pandas numpy gunicorn 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo ✅ Dependências instaladas
echo.
echo 🌐 Iniciando servidor na porta 5000...
echo 🔗 Acesse: http://localhost:5000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar Flask
python app.py

pause
