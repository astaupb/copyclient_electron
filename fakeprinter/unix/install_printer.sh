#!/bin/bash
# @license LGPL-3.0-or-later
# Copyright (c) 2018 Michael Koch <m.koch@emkay443.de>
#
# This file is part of AStA Copyclient.
# AStA Copyclient is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# AStA Copyclient is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with AStA Copyclient.  If not, see <http://www.gnu.org/licenses/>.

if ! [ $(id -u) = 0 ]; then
	SUDO='sudo'
fi

if [[ "$(uname)" == *Darwin* ]]; then
	cups_backend_dir="/usr/libexec/cups/backend"
	cups_backend_file="astaprint"
	cups_ppd_file="Ricoh-MP_C4504ex-PDF-Ricoh.ppd"
	root_user="root"
	root_group="wheel"
	spool_user="root"
	spool_group="_lp"
	spool_chmod=777
	spool_dir="/var/spool/astaprint"
else
	cups_backend_dir="/usr/lib/cups/backend"
	cups_backend_file="/opt/AStA Copyclient/fakeprinter/unix/astaprint"
	cups_ppd_file="/opt/AStA Copyclient/fakeprinter/unix/Ricoh-MP_C4504ex-PDF-Ricoh.ppd"
	root_user="root"
	root_group="root"
	spool_user="root"
	spool_group="root"
	spool_chmod=777
	spool_dir="/var/spool/astaprint"
	if [ -x "$(command -v systemctl)" ]; then # systemd exists
		if systemctl list-unit-files | grep org.cups.cupsd.service; then
			$SUDO systemctl enable org.cups.cupsd.service > /dev/null 2>&1
			$SUDO systemctl start org.cups.cupsd.service > /dev/null 2>&1
		else
			if systemctl list-unit-files | grep cups.service; then
				$SUDO systemctl enable cups.service > /dev/null 2>&1
				$SUDO systemctl start cups.service > /dev/null 2>&1
			fi
		fi
	else
		if [ -x "$(command -v service)" ]; then # service exists
			if service --status-all 2>&1 | grep -Fq 'org.cups.cupsd'; then
				$SUDO update-rc.d org.cups.cupsd enable > /dev/null 2>&1
				$SUDO service org.cups.cupsd start > /dev/null 2>&1
			else
				if service --status-all 2>&1 | grep -Fq 'cups'; then
					$SUDO update-rc.d cups enable > /dev/null 2>&1
					$SUDO service cups start > /dev/null 2>&1
				fi
			fi
		fi
	fi
fi
$SUDO cp "$cups_backend_file" "$cups_backend_dir"
$SUDO chown $root_user:$root_group "$cups_backend_dir/astaprint"
$SUDO chmod 750 "$cups_backend_dir/astaprint"
$SUDO mkdir -p "$spool_dir"
$SUDO chmod $spool_chmod "$spool_dir"
$SUDO lpadmin -p "Copyclient" -v "astaprint:$spool_dir" -E -P "$cups_ppd_file"
$SUDO lpadmin -p "Copyclient" -o "media=A4"
$SUDO lpoptions -p "Copyclient" -o "ColorModel=Gray"
$SUDO lpadmin -d "Copyclient"
exit 0
