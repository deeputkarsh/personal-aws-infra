import {
  type App, Stack, type StackProps, RemovalPolicy
} from 'aws-cdk-lib'
import { Bucket, type IBucket } from 'aws-cdk-lib/aws-s3'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { type AvailableSSM, COMMON } from '../constants/ssm'
import { FindResource } from '../utility/check-resource'
import { Role, type IRole, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'

interface BucketMap {
  sls?: IBucket
  codePipeline?: IBucket
}

type SsmMap = Record<AvailableSSM, StringParameter> | Record<string, never>
interface ServiceRoles {
  ec2Role?: IRole
  codeBuildRole?: IRole
  codePipelineRole?: IRole
  codeDeployRole?: IRole
}
type RoleKeys = keyof ServiceRoles
type BucketKeys = keyof BucketMap

export class HelperStack extends Stack {
  readonly scope: App
  readonly buckets: BucketMap
  readonly ssmParams: SsmMap
  readonly serviceRoles: ServiceRoles

  constructor (scope: App, id: string, props: StackProps) {
    super(scope, id, props)
    const {
      env: { account = '', region = '' } = {}
    } = props
    this.ssmParams = {}
    this.buckets = {}
    this.serviceRoles = {}

    this.createBucket(`codepipeline-${region}-${account}`, 'codePipeline', 'code-pipeline-bucket')
    this.createBucket(`serverless-${region}-${account}`, 'sls', 'sls-bucket')

    this.createRole('ec2Role', 'ec2-iam-role', 'ec2.amazonaws.com')
    this.createRole('codeBuildRole', 'code-build-role', 'codebuild.amazonaws.com')
    this.createRole('codePipelineRole', 'code-pipeline-role', 'codepipeline.amazonaws.com')
    this.createRole('codeDeployRole', 'code-deploy-role', 'codedeploy.amazonaws.com')
  }

  private createBucket (bucketName: string, bucketKey: BucketKeys, resourceId: string): void {
    FindResource.checkIfBucketExists(bucketName).then(bucketExists => {
      if (bucketExists) {
        this.buckets[bucketKey] = Bucket.fromBucketName(this, resourceId, bucketName)
      } else {
        this.buckets[bucketKey] = new Bucket(this, resourceId, { bucketName, removalPolicy: RemovalPolicy.DESTROY })
      }
      this.ssmParams[resourceId as AvailableSSM] = new StringParameter(this, `ssm-${resourceId}`, {
        stringValue: bucketName,
        parameterName: COMMON[resourceId as AvailableSSM]
      })
    }).catch(console.error)
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
      this.ssmParams[roleName as AvailableSSM] = new StringParameter(this, `ssm-${roleName}`, {
        stringValue: this.serviceRoles[roleKey]?.roleArn ?? ' ',
        parameterName: COMMON[roleName as AvailableSSM]
      })
    }).catch(console.error)
  }
}
