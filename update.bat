@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Cap nhat Starttrain
echo ============================================
echo   CAP NHAT STARTTRAIN - CHAM CONG
echo ============================================
echo.
echo Dang cho may chu cu dung hoan toan...
timeout /t 2 /nobreak >nul
echo.
echo [1/3] Sao luu du lieu...
node scripts\backup.js
echo.
echo [2/3] Tai ban moi ve (git pull)...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo *** CAP NHAT THAT BAI ***
  echo Du lieu cua ban khong bi anh huong. Se khoi dong lai ban cu.
  echo Neu loi lap lai, hay chup man hinh nay gui cho nguoi ho tro.
  echo.
  pause
) else (
  echo.
  echo Cap nhat thanh cong.
)
echo.
echo [3/3] Khoi dong lai may chu...
if "%1"=="--no-start" exit /b 0
start "" http://localhost:8899
node server\server.js
