#!/bin/bash
set -e

country=${1}

source "scripts/${country}.env.sh"

stack=${2}

npm run build
echo "Build successful"

if [[ "$stack" == "" ]]
then
echo "select a stack to re create"
else
stackName="${stage}-${stack}"
if [[ "$IS_TEMP_ENV" == "true" ]]; then
stackName="temp-${stackName}"
fi
# stackName="build-utility"
cdk --profile personal destroy ${stackName}
cdk --profile personal synth ${stackName}
cdk --profile personal deploy ${stackName} --require-approval never
fi
