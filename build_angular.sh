#!/bin/bash
rm -rf web
cd src
pub get
webdev build
mkdir -p ../web
cp -R build/* ../web/
cp -R ../includes/*.js ../web/
cp -R ../includes/locales ../web/
