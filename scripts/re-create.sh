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
echo "select a stack to re create"
else
stackName="${stage}-${stack}"
if [[ "$IS_TEMP_ENV" == "true" ]]; then
stackName="temp-${stackName}"
fi
# stackName="build-utility"
cdk --profile ${AWS_PROFILE} destroy ${stackName}
cdk --profile ${AWS_PROFILE} synth ${stackName}
cdk --profile ${AWS_PROFILE} deploy ${stackName} --require-approval never
fi
