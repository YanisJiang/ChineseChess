@echo off
cd /d D:\Workspace\ChineseChess
D:\Soft\Git\ucrt64\libexec\git-core\git.exe add -A
for /f %%i in ('D:\Soft\Git\ucrt64\libexec\git-core\git.exe write-tree') do set TREE=%%i
for /f %%i in ('D:\Soft\Git\ucrt64\libexec\git-core\git.exe commit-tree %TREE% -p HEAD -m "snapshot: cut keye empty alts"') do set COMMIT=%%i
D:\Soft\Git\ucrt64\libexec\git-core\git.exe tag -a conv/2026-11-05-cut-ke-ye-alts %COMMIT% -m "rollback: remove keye empty branches; expand path plans"
D:\Soft\Git\ucrt64\libexec\git-core\git.exe rev-parse --short %COMMIT%
