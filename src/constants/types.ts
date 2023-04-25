import { type StackProps } from 'aws-cdk-lib'
import { type BuildEnvironmentVariable, type Cache, type ComputeType } from 'aws-cdk-lib/aws-codebuild'
import { type STAGES } from './stages'
import { type HelperStack } from '../stacks/helper-stack'
import { type IRole } from 'aws-cdk-lib/aws-iam'

export interface BuildStackProps extends StackProps {
  repo: string
  stage: STAGES
  ssmPrefix: string
  branchName: string
  helperStack: HelperStack
  buildSpecFile?: string
  buildComputeType?: ComputeType
  withInvalidation?: boolean
  invalidationUserParameters?: any
  approvalAfterBuild?: boolean
}

export interface BuildProjectProps {
  stage: string
  ssmPrefix: string
  stackName: string
  codeBuildRole: IRole
  batchBuild?: boolean
  cacheConfig?: Cache
  buildSpecFile?: string
  account?: string
  region?: string
  buildComputeType?: ComputeType
  extraEnv?: Record<string, BuildEnvironmentVariable>
}
