#!/bin/sh

# Exit if any subcommand fails
set -e

# Setup node modules if needed
if [ -e node_modules/@shopify/splash ]; then
    setup=""
else
    echo "## Your environment is not ready yet. Installing modules..."
    if [ -f yarn.lock ]; then
        setup="yarn --non-interactive --production=false &&"
    fi
fi

echo "## Running action"
mv /babel.config.js .
mv /actionIndex.js .
sh -c "$setup yarn run babel-node actionIndex.js"
