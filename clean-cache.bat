@echo off
echo Cleaning all Next.js caches and temp files...

echo Stopping all node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo Removing .next directory...
if exist ".next" rmdir /s /q ".next"

echo Removing node_modules cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo Removing Temp next files...
del /f /s /q "%LOCALAPPDATA%\Temp\next-*" 2>nul
for /d %%p in ("%LOCALAPPDATA%\Temp\next-*") do rmdir "%%p" /s /q 2>nul

echo Removing Turbopack cache...
del /f /s /q "%LOCALAPPDATA%\Temp\turbopack-*" 2>nul
for /d %%p in ("%LOCALAPPDATA%\Temp\turbopack-*") do rmdir "%%p" /s /q 2>nul

echo Removing panic logs...
del /f /q "%LOCALAPPDATA%\Temp\next-panic-*.log" 2>nul

echo Clearing Chrome/Edge service worker cache...
echo Please also visit http://localhost:3000/unregister-sw.html in your browser

echo.
echo ✓ Cleanup complete!
echo.
echo IMPORTANT NEXT STEPS:
echo 1. Open http://localhost:3000/unregister-sw.html in your browser
echo 2. Click "Unregister All Service Workers"
echo 3. Clear browser cache (Ctrl+Shift+Delete)
echo 4. Close all localhost:3000 tabs
echo 5. Restart the dev server with: npm run dev
echo.
pause
