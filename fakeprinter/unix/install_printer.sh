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
			sudo systemctl enable org.cups.cupsd.service
			sudo systemctl start org.cups.cupsd.service
		else
			if systemctl list-unit-files | grep cups.service; then
				sudo systemctl enable cups.service
				sudo systemctl start cups.service
			fi
		fi
	else
		if [ -x "$(command -v service)" ]; then # service exists
			if service --status-all 2>&1 | grep -Fq 'org.cups.cupsd'; then
				sudo update-rc.d enable org.cups.cupsd
				sudo service org.cups.cupsd start
			else
				if service --status-all 2>&1 | grep -Fq 'cups'; then
					sudo update-rc.d enable cups
					sudo service cups start
				fi
			fi
		fi
	fi
fi
sudo cp "$cups_backend_file" "$cups_backend_dir"
sudo chown $root_user:$root_group "$cups_backend_dir/astaprint"
sudo chmod 750 "$cups_backend_dir/astaprint"
sudo mkdir -p "$spool_dir"
sudo chmod $spool_chmod "$spool_dir"
sudo lpadmin -p "Copyclient" -v "astaprint:$spool_dir" -E -P "$cups_ppd_file"
sudo lpadmin -p "Copyclient" -o "media=A4"

exit 0