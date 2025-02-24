@echo off
git add .
git commit -m "updated at %date:~0,4%/%date:~5,2%/%date:~8,2%"
git push
pause
