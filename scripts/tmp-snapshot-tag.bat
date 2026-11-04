@echo off
cd /d D:\Workspace\ChineseChess
D:\Soft\Git\ucrt64\libexec\git-core\git.exe add -A
for /f %%i in ('D:\Soft\Git\ucrt64\libexec\git-core\git.exe write-tree') do set TREE=%%i
echo TREE=%TREE%
for /f %%i in ('D:\Soft\Git\ucrt64\libexec\git-core\git.exe commit-tree %TREE% -p HEAD -m "snapshot: study-line-quality skill and wrapup"') do set COMMIT=%%i
echo COMMIT=%COMMIT%
D:\Soft\Git\ucrt64\libexec\git-core\git.exe tag -a conv/2026-11-05-study-line-quality-wrapup %COMMIT% -m "rollback: study-line-quality skill, copy, review, acceptance"
D:\Soft\Git\ucrt64\libexec\git-core\git.exe rev-parse --short %COMMIT%
