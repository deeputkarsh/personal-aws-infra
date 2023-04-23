import { type App, Stack } from 'aws-cdk-lib'
import { type BuildEnvironmentVariable, BuildEnvironmentVariableType, type Project } from 'aws-cdk-lib/aws-codebuild'
import { type Pipeline } from 'aws-cdk-lib/aws-codepipeline'
import { BuildProjectPipeline } from '../components/BuildProjectPipeline'
import { CodePipeline } from '../components/Pipeline'
import { type BuildStackProps } from '../constants/types'

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
        value: 'nextjs-serverless-402079130675'
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
      codeBuildProject: this.buildProject
    })
  }
}
