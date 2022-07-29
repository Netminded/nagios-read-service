#!/usr/bin/env bash

{
  LATEST_VERSION="v1.0.0-beta.3"
  INSTALL_DIR=/opt/netminded/nagios-read-service

  # Removes the existing installation
  {
    echo "====== Removing existing installation (Config will remain) ======"
    systemctl disable nagios-read-service.service
    rm -rf /usr/local/bin/nagios-read-service
    rm -rf $INSTALL_DIR
  }

  {
    echo "====== Downloading release: ${LATEST_VERSION} ======"

    # Goes to the temporary directory
    mkdir /tmp/nagios-read-service-installer
    cd /tmp/nagios-read-service-installer

    # Downloads the current version
    curl -sSL --fail https://github.com/Netminded/nagios-read-service/releases/download/$LATEST_VERSION/nagios-read-service-$LATEST_VERSION.tar.gz -o nagios-read-service-$LATEST_VERSION.tar.gz

    # Unzips the download
    tar -xvf nagios-read-service-$LATEST_VERSION.tar.gz
    rm -rf nagios-read-service-$LATEST_VERSION.tar.gz
  }

  {
    echo "====== Installing production dependencies ======"
    # Installs the production dependencies
    npm install --omit=dev
  }

  {
    echo "====== Installing into $INSTALL_DIR ======"
    # Makes the install directory, if it doesn't already exist
    mkdir -p $INSTALL_DIR
    # Installs the service into the install directory
    mv ./* $INSTALL_DIR/.
    # Cleanup
    rm -rf /tmp/nagios-read-service-installer
    # Goes to the directory
    cd $INSTALL_DIR

    # Replaces the shebang of nodejs with the installed binary location
    sed -i "s|#\!/usr/bin/node|#\!$(which node)|" $INSTALL_DIR/dist/app.js
  }

  {
    # Installs the default config file
    if [[ ! -e /etc/netminded/nagios-read-service/config.toml ]]; then
      echo "====== Setting up default config file in /etc/netminded/nagios-read-service/config.toml ======"
      mkdir -p /etc/netminded/nagios-read-service
      cp assets/default_config.toml /etc/netminded/nagios-read-service/config.toml
    else
      echo "====== Using existing config file ======"
    fi
    # Sets up the env file
    if [[ ! -e /etc/netminded/nagios-read-service/.env ]]; then
      echo "====== Setting up default environment variable file in /etc/netminded/nagios-read-service/.env ======"
      touch /etc/netminded/nagios-read-service/.env
    else
      echo "====== Using existing environment variable file ======"
    fi
  }

  {
    echo "====== Exposing service in /usr/local/bin/nagios-read-service ======"
    # Deletes any existing symlink
    if [[ -e /usr/local/bin/nagios-read-service ]]; then
      rm /usr/local/bin/nagios-read-service
    fi
    # Makes the service available in path
    ln -s $INSTALL_DIR/dist/app.js /usr/local/bin/nagios-read-service
  }

  {
    echo "====== Enabling the service in systemd ======"
    # Installs the systemd service
    systemctl enable $INSTALL_DIR/assets/nagios-read-service.service
  }

  {
    echo "============"
    echo "Now, to finish setup:"
    echo "  1. Setup the config file, located at /etc/netminded/nagios-read-service/config.toml"
    echo "  2. Setup the environment variable file, located at /etc/netminded/nagios-read-service/.env"
    echo "  3. Start the service: systemctl start nagios-read-service.service"
  }
}