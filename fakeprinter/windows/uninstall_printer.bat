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

:: Removing printer folder
echo Entferne Spoolverzeichnis, wenn vorhanden
if exist "%systemdrive%\astaprint" rmdir "%systemdrive%\astaprint"

:: Removing local printer port
net stop spooler /yes >nul 2>nul
for /f "tokens=2 delims=," %%i in ('wmic os get caption^,version /format:csv') do set OS=%%i
echo %os% | find "Windows 10" >nul
if errorlevel 1 (
	:: Win 8.1, 8, 7, Vista, XP
	echo Beende PDF-Drucker Software
	net stop PDF24 /yes >nul 2>nul
	taskkill /f /im pdf24.exe >nul 2>nul
	echo Entferne PDF-Drucker Software
	msiexec /x pdf24-creator-8.7.0.msi /qn
	reg delete "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Ports" /f /v "\\.\pipe\PDFPrint"

) else (
	:: Win 10
	echo Entferne virtuellen Druckeranschluss
	reg delete "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Ports" /f /v "%systemdrive%\astaprint\print.pdf"
)
net start spooler >nul 2>nul

:: Removing local printer
echo Entferne PDF-Drucker
rundll32 printui.dll,PrintUIEntry /n "AStA Copyservice Drucksystem" /dl

echo Die Deinstallation ist abgeschlossen
exit