#!/bin/bash
set -e

source "scripts/common.sh"

setCountry ${1} ${2}

source "scripts/${country}.env.sh"

runBuild

if [[ "$stack" == "" ]]
then
echo "select a stack to re create"
else
setStackName
reCreateStack
fi
