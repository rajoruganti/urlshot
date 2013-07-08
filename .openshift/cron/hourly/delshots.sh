#!/bin/bash
find $OPENSHIFT_DATA_DIR/data -daystart -maxdepth 1 -mmin +59 -type f -name "*.png" -exec rm -f {} \;
