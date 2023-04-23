#!/bin/bash
set -e

country=${1}

source "scripts/${country}.env.sh"

npm run build

# cdk --profile personal bootstrap

cdk --profile personal ls