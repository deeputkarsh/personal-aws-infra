#!/bin/bash
set -e

country=${1}
if [[ "$country" == "" ]]
then
country='ca'
fi

source "scripts/${country}.env.sh"

stack=${2}

npm run build
echo "Build successful"

if [[ "$stack" == "" ]]
then
cdk --profile personal synth
cdk --profile personal diff --all --require-approval never
else
stackName="${stage}-${stack}"
if [[ "$IS_TEMP_ENV" == "true" ]]; then
stackName="temp-${stackName}"
fi
# stackName="build-utility"
cdk --profile personal synth ${stackName}
cdk --profile personal diff ${stackName}
fi
