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

if [[ "$(uname)" ==#Darwin* ]]; then
	cups_path="/usr/libexec/cups/backend"
	spool_dir="/var/spool/astaprint"
#elif [[ "$(uname)" ==#BSD* ]]; then
	# foo
else
	cups_path="/usr/lib/cups/backend"
	spool_dir="/var/spool/astaprint"
fi
sudo rm -r "$cups_path/astaprint"
sudo rm -r "$spool_dir"
sudo lpadmin -x "Copyclient"

exit 0