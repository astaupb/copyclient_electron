#!/bin/bash
if [[ ! -z "$1" ]]; then
	if [[ "$1" == "enable_kiosk" ]]; then
		sed -i "s/_kiosk = false/_kiosk = true/g" includes/config.js
	fi
	if [[ "$1" == "disable_kiosk" ]]; then
		sed -i "s/_kiosk = true/_kiosk = false/g" includes/config.js
	fi
	if [[ "$1" == "enable_starthidden" ]]; then
		sed -i "s/_startHidden = false/_startHidden = true/g" includes/config.js
	fi
	if [[ "$1" == "disable_starthidden" ]]; then
		sed -i "s/_startHidden = true/_startHidden = false/g" includes/config.js
	fi
fi