import { type Stack } from 'aws-cdk-lib'
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  Cache, ComputeType, LinuxBuildImage,
  LocalCacheMode, PipelineProject
} from 'aws-cdk-lib/aws-codebuild'
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
      codeBuildRole,
      batchBuild = false,
      buildComputeType
    } = props
    let environmentVariables = {
      stage: { type: BuildEnvironmentVariableType.PLAINTEXT, value: stage },
      ssmPrefix: { type: BuildEnvironmentVariableType.PLAINTEXT, value: ssmPrefix },
      AccountId: { type: BuildEnvironmentVariableType.PLAINTEXT, value: account }
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
      role: codeBuildRole,
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
