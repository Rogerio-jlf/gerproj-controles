@echo off
title Gerenciador de Usuarios (via ts-node)

setlocal enabledelayedexpansion

:MENU
cls
echo ===============================
echo     GERENCIADOR DE USUARIOS
echo ===============================
echo.
echo 1. Adicionar novo usuario
echo 2. Atualizar senha de usuario
echo 3. Deletar usuario
echo 4. Sair
echo.
set /p opcao=Escolha uma opcao:

if "%opcao%"=="1" goto ADD
if "%opcao%"=="2" goto UPDATE
if "%opcao%"=="3" goto DELETE
if "%opcao%"=="4" goto END
goto MENU

:VALIDA_EMAIL
rem Validação simples de email (apenas verifica se tem @ e .)
echo %email% | findstr "@.*\." >nul || (
  echo ❌ Email invalido!
  timeout /t 2 >nul
  goto MENU
)
goto :eof

:ADD
cls
echo ======== Adicionar novo usuario ========
set /p email=Informe o email:
call :VALIDA_EMAIL

set /p codCliente=Codigo do cliente (ou null para admin):
set /p isAdmin=E admin? (true/false):
set /p senha=Digite uma senha:

echo Validando email...

npx ts-node --project tsconfig.scripts.json scripts/gerenciador_usuario.ts add %email% %senha% %codCliente% %isAdmin%

pause
goto MENU

:UPDATE
cls
echo ======== Atualizar senha de usuario ========
set /p email=Informe o email:
call :VALIDA_EMAIL

set /p senha=Digite a nova senha:

npx ts-node --project tsconfig.scripts.json scripts/gerenciador_usuario.ts update %email% %senha%

pause
goto MENU

:DELETE
cls
echo ======== Deletar usuario ========
set /p email=Informe o email:
call :VALIDA_EMAIL

npx ts-node --project tsconfig.scripts.json scripts/gerenciador_usuario.ts delete %email%

pause
goto MENU

:END
echo Saindo...
exit /b
