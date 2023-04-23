#!/bin/bash
set -e

country=${1}
if [[ "$country" == "" ]]
then
country='ca'
fi

source "scripts/${country}.env.sh"

npm run build

# cdk --profile personal bootstrap

cdk --profile personal ls