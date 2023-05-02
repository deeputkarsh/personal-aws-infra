#!/bin/bash
set -e

source "scripts/common.sh"

setCountry ${1}

source "scripts/${country}.env.sh"

runBuild

listStack