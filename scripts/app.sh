#!/bin/bash
set -e

source "scripts/common.sh"

setCountry

source "scripts/${country}.env.sh"

runBuild

if [[ "$1" == "stop" ]]
then
  stack='alb'
  setStackName
  destroyStack ${stackName} --force
  stack='rds'
  setStackName
  destroyStack ${stackName} --force
else
  stack='rds'
  setStackName
  deployStack --require-approval never
  stack='alb'
  setStackName
  deployStack --require-approval never
fi

