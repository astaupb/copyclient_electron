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

!include LogicLib.nsh
Name "AStA Copyclient"
OutFile "..\dist\setup-copyclient.exe"
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
	IfFileExists "$INSTDIR\AStA Copyclient.exe" AskUninstallFirst Install
	AskUninstallFirst:
		MessageBox MB_YESNO "Es wurde eine vorherige Installation des Copyclients gefunden.$\r$\nSoll diese vorher entfernt werden?" IDYES UninstallFirst IDNO Goodbye
		UninstallFirst:
			ExecWait "$INSTDIR\fakeprinter\uninstall_printer.cmd"
			ExecWait '"$WINDIR\System32\taskkill.exe" /f /im "AStA Copyclient.exe"'
			ExecWait '"$WINDIR\System32\taskkill.exe" /f /im pdf24.exe'
			Delete "$INSTDIR\uninstall.exe"
			Delete "$INSTDIR\AStA Copyclient.exe"
			Delete "$INSTDIR\license.txt"
			RMDir "$INSTDIR\fakeprinter"
			Delete "$SMPROGRAMS\AStA Uni Paderborn\AStA Copyclient.lnk"
			Delete "$SMPROGRAMS\AStA Uni Paderborn\Deinstallieren.lnk"
			Delete "$DESKTOP\AStA Copyclient.lnk"
			Delete "$SMSTARTUP\AStA Copyclient starten.lnk"
			DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AStA Copyclient"
			RMDir /R "$INSTDIR"
			RMDir /R "$SMPROGRAMS\AStA Uni Paderborn"
			Goto Install
	Install:
		File "..\dist\AStA Copyclient.exe"
		File "..\includes\icons\asta.ico"
		File "license.txt"
		File /r "..\fakeprinter\windows"
		Rename "$INSTDIR\windows" "$INSTDIR\fakeprinter"
		WriteUninstaller "$INSTDIR\uninstall.exe"
		CreateDirectory "$SMPROGRAMS\AStA Uni Paderborn"
		CreateShortCut "$SMPROGRAMS\AStA Uni Paderborn\AStA Copyclient.lnk" "$INSTDIR\AStA Copyclient.exe" ""
		CreateShortCut "$SMPROGRAMS\AStA Uni Paderborn\Deinstallieren.lnk" "$INSTDIR\uninstall.exe" ""
		CreateShortCut "$DESKTOP\AStA Copyclient.lnk" "$INSTDIR\AStA Copyclient.exe" ""
		CreateShortCut "$SMSTARTUP\AStA Copyclient starten.lnk" "$INSTDIR\AStA Copyclient.exe" ""
		SetOutPath "$INSTDIR\fakeprinter"
		ExecWait "install_printer.cmd"
		WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AStA Copyclient" "DisplayName" "AStA Copyclient"
		WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AStA Copyclient" "Publisher" "AStA Universität Paderborn"
		WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AStA Copyclient" "DisplayIcon" "$\"$INSTDIR\asta.ico$\""
		WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AStA Copyclient" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""

		MessageBox MB_YESNO|MB_ICONQUESTION "Um die Installation abzuschliessen, muss der Computer neugestartet werden.$\r$\nSoll der Computer jetzt neugestartet werden?" IDNO +2
		Reboot
	Goodbye:
SectionEnd

Section "Uninstall"
	SetShellVarContext all
	ExecWait "$INSTDIR\fakeprinter\uninstall_printer.cmd"
	ExecWait '"$WINDIR\System32\taskkill.exe" /f /im AStA Copyclient.exe'
	ExecWait '"$WINDIR\System32\taskkill.exe" /f /im pdf24.exe'
	Delete "$INSTDIR\uninstall.exe"
	Delete "$INSTDIR\AStA Copyclient.exe"
	Delete "$INSTDIR\asta.ico"
	Delete "$INSTDIR\license.txt"
	RMDir "$INSTDIR\fakeprinter"
	Delete "$SMPROGRAMS\AStA Uni Paderborn\AStA Copyclient.lnk"
	Delete "$SMPROGRAMS\AStA Uni Paderborn\Deinstallieren.lnk"
	Delete "$DESKTOP\AStA Copyclient.lnk"
	Delete "$SMSTARTUP\AStA Copyclient starten.lnk"
	RMDir /R "$INSTDIR"
	RMDir /R "$SMPROGRAMS\AStA Uni Paderborn"
	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AStA Copyclient"
	MessageBox MB_YESNO|MB_ICONQUESTION "Um die Deinstallation abzuschliessen, muss der Computer neugestartet werden.$\r$\nSoll der Computer jetzt neugestartet werden?" IDNO +2
	Reboot
SectionEnd
