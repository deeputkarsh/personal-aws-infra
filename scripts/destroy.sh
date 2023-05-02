#!/bin/bash
set -e

source "scripts/common.sh"

setCountry ${1} ${2}

source "scripts/${country}.env.sh"

runBuild

if [[ "$stack" == "" ]]
then
destroyStack --all
else
setStackName
destroyStack ${stackName}
fi
