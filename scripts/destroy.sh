#!/bin/bash
set -e

country=${1}

source "scripts/${country}.env.sh"

stack=${2}

npm run build
echo "Build successful"

if [[ "$stack" == "" ]]
then
cdk --profile personal destroy --all
else
stackName="${stage}-${stack}"
if [[ "$IS_TEMP_ENV" == "true" ]]; then
stackName="temp-${stackName}"
fi
# stackName="build-utility"
cdk --profile personal destroy ${stackName}
fi
