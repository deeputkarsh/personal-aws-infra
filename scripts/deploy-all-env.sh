#!/bin/bash
set -e

country=${1}

stack=${2}

if [[ "$stack" == "" ]]
then
echo "stack is required"
exit 1
fi

deployStack () {
  source "scripts/${country}.${1}.env.sh"
  stackName="${stage}-${stack}"
  if [[ "$IS_TEMP_ENV" == "true" ]]; then
  stackName="temp-${stackName}"
  fi
  echo "building for ${stackName}"
  npm run build
  # cdk --profile personal synth ${stackName}
  cdk --profile personal deploy ${stackName} --require-approval never
}

deployStack uat
deployStack prod
