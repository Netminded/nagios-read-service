#!/usr/bin/env sh

# Performs a clean build
rm -rf ./dist
npm run build

# Copies relevant files to a temporary directory
mkdir /tmp/nagios-build
cp ./README.md /tmp/nagios-build/README.md
cp ./package.json /tmp/nagios-build/package.json
cp ./package-lock.json /tmp/nagios-build/package-lock.json
cp -r ./assets /tmp/nagios-build/assets
cp -r ./dist /tmp/nagios-build/dist

# Packages
tar -C /tmp/nagios-build -czvf nagios-read-service-v1.0.0-beta.3.tar.gz .

# Cleanup
rm -rf /tmp/nagios-build