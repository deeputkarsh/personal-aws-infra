import { type App, Stack } from 'aws-cdk-lib'
import { type BuildEnvironmentVariable, BuildEnvironmentVariableType, type Project } from 'aws-cdk-lib/aws-codebuild'
import { type Pipeline } from 'aws-cdk-lib/aws-codepipeline'
import { BuildProjectPipeline } from '../components/BuildProjectPipeline'
import { CodePipeline } from '../components/Pipeline'
import { type BuildStackProps } from '../constants/types'
import { type Role } from 'aws-cdk-lib/aws-iam'

interface CommonPipelineProps extends BuildStackProps {
  nextjsApp?: string
  withCopyDist?: boolean
  batchBuild?: boolean
  copyDistUserParam?: any
}
export class PipelineStack extends Stack {
  readonly pipeline: Pipeline

  readonly buildProject: Project

  constructor (scope: App, id: string, props: CommonPipelineProps) {
    super(scope, id, props)
    const {
      repo,
      stage,
      ssmPrefix,
      nextjsApp,
      batchBuild,
      branchName,
      helperStack,
      withCopyDist,
      buildComputeType,
      copyDistUserParam,
      env: { account = '', region = '' } = {}
    } = props
    const stackName = id
    const extraEnv: Record<string, BuildEnvironmentVariable> = {}
    if (typeof nextjsApp === 'string' && nextjsApp !== '') {
      extraEnv.deploymentBucket = {
        type: BuildEnvironmentVariableType.PLAINTEXT,
        value: `nextjs-serverless-${account}`
      }
      extraEnv.appName = {
        type: BuildEnvironmentVariableType.PLAINTEXT,
        value: nextjsApp
      }
    }
    this.buildProject = new BuildProjectPipeline(this, 'code-build', {
      stage,
      ssmPrefix,
      account,
      stackName,
      extraEnv,
      batchBuild,
      codeBuildRole: helperStack.serviceRoles.codeBuildRole as Role,
      buildComputeType
    })
    this.pipeline = new CodePipeline(this, 'code-pipeline', {
      repo,
      region,
      account,
      stackName,
      batchBuild,
      branchName,
      withCopyDist,
      copyDistUserParam,
      stage,
      codePipelineRole: helperStack.serviceRoles.codePipelineRole as Role,
      codeBuildProject: this.buildProject
    })
  }
}
