import { type App, Stack } from 'aws-cdk-lib'
import { InstanceTagSet, ServerApplication, ServerDeploymentGroup } from 'aws-cdk-lib/aws-codedeploy'
import { Role } from 'aws-cdk-lib/aws-iam'
import { BuildProjectPipeline } from '../components/BuildProjectPipeline'
import { CodePipeline } from '../components/Pipeline'
import { CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP } from '../constants/ec2'
import { type BuildStackProps } from '../constants/types'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { COMMON } from '../constants/ssm'

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
      buildComputeType,
      buildSpecFile
    })
    this.codeDeployApp = new ServerApplication(this, 'code-deploy-app', { applicationName: stackName })
    this.codeDeployDeploymentGrp = new ServerDeploymentGroup(this, 'code-deploy-deployment-grp', {
      application: this.codeDeployApp,
      deploymentGroupName: stackName,
      role: Role.fromRoleArn(this, 'code-deploy-role', StringParameter.valueForStringParameter(this, COMMON['code-deploy-role']), { mutable: false }),
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
