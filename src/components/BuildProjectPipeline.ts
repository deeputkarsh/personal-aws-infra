import { type Stack } from 'aws-cdk-lib'
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  Cache, ComputeType, LinuxBuildImage,
  LocalCacheMode, PipelineProject
} from 'aws-cdk-lib/aws-codebuild'
import { Role } from 'aws-cdk-lib/aws-iam'
import { CODE_BUILD_ROLE } from '../constants/roles'
import { COMMON } from '../constants/ssm'
import { type BuildProjectProps } from '../constants/types'

export class BuildProjectPipeline extends PipelineProject {
  constructor (scope: Stack, id: string, props: BuildProjectProps) {
    const {
      stage,
      ssmPrefix,
      account,
      stackName,
      cacheConfig,
      buildSpecFile,
      extraEnv,
      batchBuild = false,
      buildComputeType
    } = props
    let environmentVariables = {
      stage: { type: BuildEnvironmentVariableType.PLAINTEXT, value: stage },
      ssmPrefix: { type: BuildEnvironmentVariableType.PLAINTEXT, value: ssmPrefix },
      AccountId: { type: BuildEnvironmentVariableType.PLAINTEXT, value: account },
      SERVERLESS_DEPLOYMENT_BUCKET: { type: BuildEnvironmentVariableType.PARAMETER_STORE, value: `/${COMMON.SERVERLESS_DEPLOYMENT_BUCKET}` },
      SECURITY_GROUP: { type: BuildEnvironmentVariableType.PARAMETER_STORE, value: `${ssmPrefix}/${COMMON.SECURITY_GROUP}` },
      SUBNET_1: { type: BuildEnvironmentVariableType.PARAMETER_STORE, value: `${ssmPrefix}/${COMMON.SUBNET_1}` },
      SUBNET_2: { type: BuildEnvironmentVariableType.PARAMETER_STORE, value: `${ssmPrefix}/${COMMON.SUBNET_2}` }
    }
    if (extraEnv != null) {
      environmentVariables = {
        ...environmentVariables,
        ...extraEnv
      }
    }
    super(scope, id, {
      projectName: `${stackName}-codebuild`,
      description: `${stackName} CodeBuild`,
      buildSpec: BuildSpec.fromSourceFilename(buildSpecFile ?? 'buildspec.yml'),
      cache: cacheConfig ?? Cache.local(
        LocalCacheMode.DOCKER_LAYER,
        LocalCacheMode.SOURCE,
        LocalCacheMode.CUSTOM
      ),
      role: Role.fromRoleArn(scope, 'codebuild-role', CODE_BUILD_ROLE, { mutable: false }),
      environment: {
        privileged: true,
        buildImage: LinuxBuildImage.STANDARD_5_0,
        computeType: buildComputeType ?? ComputeType.SMALL,
        environmentVariables
      }
    })
    if (batchBuild) {
      this.enableBatchBuilds()
    }
  }
}
