#!/bin/bash

# Simple bash script to build the GNOME Shell extension
echo "Zipping the extension..."
zip -r easy_docker_containers@red.software.systems.zip . -x *.git* -x *.idea* -x *.history* -x *.*~ -x build.sh
echo "Building is done."
