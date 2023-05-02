# cdk --profile ${AWS_PROFILE} bootstrap

setCountry () {
  country=${1}
  if [[ "$country" == "" ]]
  then
  country='ca'
  fi
  stack=${2}
}

runBuild () {
  npm run build
  echo "Build successful"
}

setStackName () {
  stackName="${stage}-${stack}"
  if [[ "$IS_TEMP_ENV" == "true" ]]; then
  stackName="temp-${stackName}"
  fi
  if [[ "$stack" == "helper" ]]
  then
  stackName="helper-stack"
  fi
}

listStack () {
  cdk --profile ${AWS_PROFILE} ls
}
deployStack () {
  cdk --profile ${AWS_PROFILE} synth ${stackName}
  cdk --profile ${AWS_PROFILE} deploy ${stackName}
}
deployAllStack () {
  cdk --profile ${AWS_PROFILE} synth
  cdk --profile ${AWS_PROFILE} deploy --all --require-approval never
}
diffStack () {
  cdk --profile ${AWS_PROFILE} synth ${stackName}
  cdk --profile ${AWS_PROFILE} diff ${stackName}
}
destroyStack () {
  cdk --profile ${AWS_PROFILE} destroy ${1}
}
reCreateStack () {
  cdk --profile ${AWS_PROFILE} destroy ${stackName}
  cdk --profile ${AWS_PROFILE} synth ${stackName}
  cdk --profile ${AWS_PROFILE} deploy ${stackName} --require-approval never
}