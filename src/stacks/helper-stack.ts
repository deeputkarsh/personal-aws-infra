import {
  type App, Stack, type StackProps
} from 'aws-cdk-lib'
import { Bucket, type IBucket } from 'aws-cdk-lib/aws-s3'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { COMMON } from '../constants/ssm'
import { FindResource } from '../utility/check-resource'
import { Role, type IRole, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'

interface BucketMap {
  sls?: IBucket
}
interface SsmMap {
  sls?: StringParameter
}
interface ServiceRoles {
  ec2Role?: IRole
  codeBuildRole?: IRole
  codePipelineRole?: IRole
  codeDeployRole?: IRole
}
type RoleKeys = keyof ServiceRoles

export class HelperStack extends Stack {
  readonly scope: App
  readonly buckets: BucketMap
  readonly ssmParams: SsmMap
  readonly serviceRoles: ServiceRoles

  constructor (scope: App, id: string, props: StackProps) {
    super(scope, id, props)
    const {
      env: { account = '' } = {}
    } = props
    this.ssmParams = {}
    this.buckets = {}
    this.serviceRoles = {}
    const slsBucketName = `serverless-dep-bucket-${account}`
    FindResource.checkIfBucketExists(slsBucketName).then(bucketExists => {
      const resourceId = 'sls-dep-bucket'
      if (bucketExists) {
        this.buckets.sls = Bucket.fromBucketName(this, resourceId, slsBucketName)
      } else {
        this.buckets.sls = new Bucket(this, resourceId, { bucketName: slsBucketName })
      }
      this.ssmParams.sls = new StringParameter(this, 'ssm-param', {
        stringValue: this.buckets.sls.bucketName,
        parameterName: `/${COMMON.SERVERLESS_DEPLOYMENT_BUCKET}`
      })
    }).catch(console.error)

    this.createRole('ec2Role', 'ec2-iam-role', 'ec2.amazonaws.com')
    this.createRole('codeBuildRole', 'code-build-role', 'codebuild.amazonaws.com')
    this.createRole('codePipelineRole', 'code-pipeline-role', 'codepipeline.amazonaws.com')
    this.createRole('codeDeployRole', 'code-deploy-role', 'codedeploy.amazonaws.com')
  }

  private createRole (roleKey: RoleKeys, roleName: string, principal: string): void {
    FindResource.checkIfRoleExists(roleName).then(roleExists => {
      if (roleExists) {
        this.serviceRoles[roleKey] = Role.fromRoleName(this, roleName, roleName)
      } else {
        this.serviceRoles[roleKey] = new Role(this, roleName, {
          roleName,
          assumedBy: new ServicePrincipal(principal),
          // Assigning Admin access to all roles if following least privilege this should not be done
          managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')]
        })
      }
    }).catch(console.error)
  }
}
