@ECHO OFF

:: @license LGPL-3.0-or-later
:: Copyright (c) 2018 Michael Koch <m.koch@emkay443.de>
::
:: This file is part of AStA Copyclient.
:: AStA Copyclient is free software: you can redistribute it and/or modify
:: it under the terms of the GNU General Public License as published by
:: the Free Software Foundation, either version 2 of the License, or
:: (at your option) any later version.
::
:: AStA Copyclient is distributed in the hope that it will be useful,
:: but WITHOUT ANY WARRANTY; without even the implied warranty of
:: MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
:: GNU General Public License for more details.
::
:: You should have received a copy of the GNU General Public License
:: along with AStA Copyclient.  If not, see <http://www.gnu.org/licenses/>.

echo Dieses Fenster bitte nicht schliessen!
echo Es wird automatisch geschlossen, wenn alle Schritte erledigt sind.
echo ==================================================================

:: CD to this folder
cd /d %~dp0

:: Creating printer folder
echo Erstelle Spoolverzeichnis, wenn noch nicht vorhanden
if not exist "%systemdrive%\astaprint" mkdir "%systemdrive%\astaprint"

:: Installing printer port and driver (PDF on W10, XPS else)
for /f "tokens=2 delims=," %%i in ('wmic os get caption^,version /format:csv') do set OS=%%i
echo %os% | find "Windows 10" >nul
if errorlevel 1 (
	:: Win 8.1, 8, 7, Vista, XP
	goto INST7
) else (
	:: Win 10
	goto INST10
)

:EXIT
echo Die Installation ist abgeschlossen
exit

:INST7
echo Installiere PDF-Drucker
start /wait msiexec /i pdf24-creator-8.7.0.msi /norestart TRANSFORMS=asta.mst /QN
taskkill /f /im pdf24.exe >nul 2>nul
net stop PDF24 /yes >nul 2>nul
echo Importiere notwendige Einstellungen in die Registry
reg Query "HKLM\Hardware\Description\System\CentralProcessor\0" | find /i "x86" > NUL && set ARCH=32BIT || set ARCH=64BIT
if %ARCH%==32BIT (
	regedit /s asta32.reg >nul
)
if %ARCH%==64BIT (
	regedit /s asta64.reg >nul
)
ping 127.0.0.1 -n 3 >nul
echo Starte PDF-Drucker Software
net start PDF24 >nul 2>nul
SET PROGFILES=%ProgramFiles(x86)%
IF NOT DEFINED ProgramFiles(x86) SET PROGFILES=%PROGRAMFILES%
start "" "%PROGFILES%\PDF24\pdf24.exe"
goto EXIT

:INST10
net stop spooler /yes >nul 2>nul
echo Fuege virtuellen Druckeranschluss hinzu
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Ports" /v "%systemdrive%\astaprint\astaprint_windows10.pdf" /t reg_sz /f >nul
net start spooler >nul 2>nul
ping 127.0.0.1 -n 6 >nul
echo Installiere modifizierten Windows 10 PDF-Drucker
rundll32 printui.dll,PrintUIEntry /if /b "AStA Copyclient-App" /r "%systemdrive%\astaprint\astaprint_windows10.pdf" /m "Microsoft Print To PDF"
goto EXIT