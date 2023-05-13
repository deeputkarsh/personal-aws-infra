import { type Stack } from 'aws-cdk-lib'
import {
  type CfnDeploymentGroup,
  type EcsApplication, EcsDeploymentGroup,
  type ServerApplication, type ServerDeploymentGroup
} from 'aws-cdk-lib/aws-codedeploy'
import {
  Artifact, ArtifactPath, Pipeline, type StageOptions, type StageProps
} from 'aws-cdk-lib/aws-codepipeline'
import {
  CodeBuildAction, type CodeBuildActionProps, CodeDeployEcsDeployAction,
  CodeDeployServerDeployAction, CodeStarConnectionsSourceAction,
  /* ManualApprovalAction, */ S3DeployAction
} from 'aws-cdk-lib/aws-codepipeline-actions'
import { Role } from 'aws-cdk-lib/aws-iam'
import { Bucket } from 'aws-cdk-lib/aws-s3'

import { STAGE, type STAGES } from '../constants/stages'
import { type BuildProjectPipeline } from './BuildProjectPipeline'
import { ENV_VARS } from '../config'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { COMMON } from '../constants/ssm'

interface codeDeployItem {
  actionName: string
  artifactName: string
  codeDeployApp: EcsApplication | ServerApplication
  codeDeployGrp: CfnDeploymentGroup | ServerDeploymentGroup
}
interface PipelineProps {
  stackName: string
  region: string
  account: string
  repo: string
  stage: STAGES
  branchName: string
  withInvalidation?: boolean
  invalidationUserParameters?: any
  withCopyDist?: boolean
  copyDistUserParam?: any
  isECS?: boolean
  codeBuildProject: BuildProjectPipeline
  s3DeployConfig?: {
    bucket: Bucket
  }
  apiLambdaDeploy?: any[]
  codeDeployList?: codeDeployItem[]
  batchBuild?: boolean
  approvalAfterBuild?: boolean
}

export class CodePipeline extends Pipeline {
  constructor (scope: Stack, id: string, props: PipelineProps) {
    const {
      batchBuild, codeDeployList,
      s3DeployConfig, isECS = false,
      stackName, repo,
      branchName, codeBuildProject, stage,
      approvalAfterBuild = Boolean(codeDeployList)
    } = props
    const sourcArtifact = new Artifact('SourceCode')
    const stages: StageProps[] = [{
      stageName: 'CodeCommit',
      actions: [new CodeStarConnectionsSourceAction({
        actionName: 'Source',
        owner: ENV_VARS.GIT_OWNER,
        repo,
        branch: branchName,
        output: sourcArtifact,
        connectionArn: ENV_VARS.codestarConnectionARN
      })]
    }]
    super(scope, id, {
      pipelineName: `${stackName}-pipeline`,
      crossAccountKeys: false,
      artifactBucket: Bucket.fromBucketName(scope, 'code-pipeline-bucket', StringParameter.valueForStringParameter(scope, COMMON['code-pipeline-bucket'])),
      role: Role.fromRoleArn(scope, 'code-pipeline-role', StringParameter.valueForStringParameter(scope, COMMON['code-pipeline-role']), { mutable: false }),
      stages
    })

    const codebuildOutputs: Artifact[] = []
    type codeDeployType = (CodeDeployServerDeployAction | CodeDeployEcsDeployAction)

    const codeDeployActions: codeDeployType[] = [] as codeDeployType[]
    const isProductionPipeline = stage === STAGE.prod
    if (codeDeployList != null) {
      codeDeployList.forEach(({
        artifactName,
        actionName,
        codeDeployApp,
        codeDeployGrp
      }) => {
        const artifact = new Artifact(artifactName)
        codebuildOutputs.push(artifact)

        if (isECS) {
          codeDeployActions.push(new CodeDeployEcsDeployAction({
            actionName,
            deploymentGroup: EcsDeploymentGroup
              .fromEcsDeploymentGroupAttributes(scope, actionName, {
                application: codeDeployApp,
                deploymentGroupName: codeDeployGrp.deploymentGroupName ?? ''
              }),
            appSpecTemplateFile: new ArtifactPath(artifact, 'appspec.yml'),
            taskDefinitionTemplateFile: new ArtifactPath(artifact, 'taskdef.json'),
            containerImageInputs: [{ input: artifact, taskDefinitionPlaceholder: 'IMAGE1_NAME' }]
          }))
        } else {
          codeDeployActions.push(new CodeDeployServerDeployAction({
            actionName,
            input: artifact,
            deploymentGroup: codeDeployGrp as ServerDeploymentGroup
          }))
        }
      })
    }
    let s3Deploy: S3DeployAction | undefined
    if (s3DeployConfig != null) {
      const artifact = new Artifact('BuiltCode')
      codebuildOutputs.push(artifact)
      s3Deploy = new S3DeployAction({
        actionName: 'S3Deploy',
        bucket: s3DeployConfig.bucket,
        input: artifact
      })
    }
    const codebuildActionProp: CodeBuildActionProps = {
      actionName: 'Build',
      input: sourcArtifact,
      project: codeBuildProject,
      executeBatchBuild: batchBuild,
      combineBatchBuildArtifacts: false,
      outputs: (codebuildOutputs.length > 0) ? codebuildOutputs : undefined
    }
    let codebuildOptions: StageOptions = {
      stageName: 'CodeBuild',
      actions: [new CodeBuildAction(codebuildActionProp)]
    }
    /* const manualApprovalAction = {
      stageName: 'Approval',
      actions: [new ManualApprovalAction({ actionName: 'ManualApproval' })]
    } */
    if (!approvalAfterBuild && isProductionPipeline) {
      // this.addStage(manualApprovalAction)
    } else if (ENV_VARS.DISABLED_PIPELINES) {
      codebuildOptions = {
        ...codebuildOptions,
        transitionToEnabled: false,
        transitionDisabledReason: 'Disabled when created'
      }
    }
    this.addStage(codebuildOptions)
    if (codeDeployActions.length > 0) {
      if (isProductionPipeline && approvalAfterBuild) {
        // this.addStage(manualApprovalAction)
      }
      this.addStage({
        stageName: 'CodeDeploy',
        actions: codeDeployActions
      })
    }
    if (s3Deploy != null) {
      this.addStage({
        stageName: 'CodeDeploy',
        actions: [s3Deploy]
      })
    }
  }
}
