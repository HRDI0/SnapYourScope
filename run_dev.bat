@echo off
echo Starting Advanced Analysis Platform...

:: Start Backend in a new window
start "Analysis Backend" cmd /k "call venv\Scripts\activate && python run_backend.py"

:: Wait for backend to initialize
timeout /t 3

:: Start Frontend in a new window
cd frontend
start "Analysis Dashboard" cmd /k "npm run dev"

echo.
echo ===================================================
echo  Servers are running!
echo  Backend: http://127.0.0.1:8000/docs
echo  Frontend: http://localhost:5173 (Check console)
echo ===================================================
pause
