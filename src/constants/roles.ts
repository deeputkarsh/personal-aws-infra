import { ENV_VARS } from '../config'

export const CODE_BUILD_ROLE = `arn:aws:iam::${ENV_VARS.account}:role/CodeBuild-common-service-role`
export const CODE_PIPELINE_ROLE = `arn:aws:iam::${ENV_VARS.account}:role/CodePipeline-common-service-role`
export const CODE_DEPLOY_ROLE = `arn:aws:iam::${ENV_VARS.account}:role/CodeDeploy-common-service-role`
export const APP_INSTANCE_ROLE = `arn:aws:iam::${ENV_VARS.account}:role/ec2-iam-role`
