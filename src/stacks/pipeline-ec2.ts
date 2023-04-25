import { type App, Stack } from 'aws-cdk-lib'
import { InstanceTagSet, ServerApplication, ServerDeploymentGroup } from 'aws-cdk-lib/aws-codedeploy'
import { type Role } from 'aws-cdk-lib/aws-iam'
import { BuildProjectPipeline } from '../components/BuildProjectPipeline'
import { CodePipeline } from '../components/Pipeline'
import { CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP } from '../constants/ec2'
import { type BuildStackProps } from '../constants/types'

export class PipelineEC2Stack extends Stack {
  readonly codePipeline: CodePipeline

  readonly codeBuildProject: BuildProjectPipeline

  readonly codeDeployApp: ServerApplication

  readonly codeDeployDeploymentGrp: ServerDeploymentGroup

  constructor (scope: App, id: string, props: BuildStackProps) {
    super(scope, id, props)
    const {
      repo,
      stage,
      ssmPrefix,
      helperStack,
      buildComputeType,
      buildSpecFile,
      branchName = 'main',
      env = {}
    } = props
    const { account = '', region = '' } = env
    const stackName = id

    this.codeBuildProject = new BuildProjectPipeline(this, 'code-build', {
      stage,
      ssmPrefix,
      account,
      stackName,
      codeBuildRole: helperStack.serviceRoles.codeBuildRole as Role,
      buildComputeType,
      buildSpecFile
    })
    this.codeDeployApp = new ServerApplication(this, 'code-deploy-app', { applicationName: stackName })
    this.codeDeployDeploymentGrp = new ServerDeploymentGroup(this, 'code-deploy-deployment-grp', {
      application: this.codeDeployApp,
      deploymentGroupName: stackName,
      role: helperStack.serviceRoles.codeDeployRole as Role,
      autoRollback: { failedDeployment: true, stoppedDeployment: true },
      ec2InstanceTags: new InstanceTagSet({
        [CODE_DEPLOY_TAG_NAME]: [EC2_CODE_DEPLPOY_TAG_MAP[stage]]
      })
    })
    this.codePipeline = new CodePipeline(this, 'code-pipeline', {
      stackName,
      repo,
      region,
      account,
      branchName,
      stage,
      codePipelineRole: helperStack.serviceRoles.codePipelineRole as Role,
      codeBuildProject: this.codeBuildProject,
      codeDeployList: [{
        artifactName: 'BuiltCode',
        actionName: 'CodeDeploy',
        codeDeployApp: this.codeDeployApp,
        codeDeployGrp: this.codeDeployDeploymentGrp
      }]
    })
  }
}
