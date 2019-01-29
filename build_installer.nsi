# @license LGPL-3.0-or-later
# Copyright (c) 2018 Michael Koch <m.koch@emkay443.de>
#
# This file is part of AStA Copyclient.
# AStA Copyclient is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# AStA Copyclient is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with AStA Copyclient.  If not, see <http://www.gnu.org/licenses/>.

Name "AStA Copyclient"
OutFile "dist\setup-copyclient.exe"
InstallDir "$PROGRAMFILES\AStA Uni Paderborn\Copyclient"
Page license
Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

LicenseData "license.txt"

Section ""
	SetOutPath "$INSTDIR"
	SetShellVarContext all
	File "dist\AStA Copyclient 0.0.11.exe"
	File "license.txt"
	File /r "fakeprinter\windows"
	Rename "$INSTDIR\windows" "$INSTDIR\fakeprinter"
	WriteUninstaller "$INSTDIR\uninstall.exe"
	CreateDirectory "$SMPROGRAMS\AStA Uni Paderborn"
	CreateShortCut "$SMPROGRAMS\AStA Uni Paderborn\AStA Copyclient.lnk" "$INSTDIR\AStA Copyclient 0.0.11.exe" ""
	CreateShortCut "$SMPROGRAMS\AStA Uni Paderborn\Deinstallieren.lnk" "$INSTDIR\uninstall.exe" ""
	CreateShortCut "$DESKTOP\AStA Copyclient.lnk" "$INSTDIR\AStA Copyclient 0.0.11.exe" ""
	CreateShortCut "$SMSTARTUP\AStA Copyclient.lnk" "$INSTDIR\AStA Copyclient 0.0.11.exe" ""
	SetOutPath "$INSTDIR\fakeprinter"
	Exec "install_printer.bat"
SectionEnd

Section "Uninstall"
	SetShellVarContext all
	Exec "$INSTDIR\fakeprinter\uninstall_printer.bat"
	Exec '"$WINDIR\System32\taskkill.exe" /f /im AStA Copyclient 0.0.11.exe'
	Delete "$INSTDIR\uninstall.exe"
	Delete "$INSTDIR\AStA Copyclient 0.0.11.exe"
	Delete "$INSTDIR\license.txt"
	RMDir "$INSTDIR\fakeprinter"
	Delete "$SMPROGRAMS\AStA Uni Paderborn\AStA Copyclient.lnk"
	Delete "$SMPROGRAMS\AStA Uni Paderborn\Deinstallieren.lnk"
	Delete "$DESKTOP\AStA Copyclient.lnk"
	RMDir "$INSTDIR"
	RMDir "$SMPROGRAMS\AStA Uni Paderborn"
SectionEnd
