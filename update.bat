@echo off
call pnpm run lint
if errorlevel 1 (
    pause
    exit /b 1
)
git add .
git commit -m "updated at %date:~0,4%/%date:~5,2%/%date:~8,2%"
git push
pause
