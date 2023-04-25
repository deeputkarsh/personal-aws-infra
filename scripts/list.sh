#!/bin/bash
set -e

country=${1}
if [[ "$country" == "" ]]
then
country='ca'
fi

source "scripts/${country}.env.sh"

npm run build

# cdk --profile ${AWS_PROFILE} bootstrap

cdk --profile ${AWS_PROFILE} ls