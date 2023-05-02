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
cdk --profile ${AWS_PROFILE} destroy --all
else
stackName="${stage}-${stack}"
if [[ "$IS_TEMP_ENV" == "true" ]]; then
stackName="temp-${stackName}"
fi
if [[ "$stack" == "helper" ]]
then
stackName="helper-stack"
fi

cdk --profile ${AWS_PROFILE} destroy ${stackName}
fi
