import { type StackProps } from 'aws-cdk-lib'
import { type BuildEnvironmentVariable, type Cache, type ComputeType } from 'aws-cdk-lib/aws-codebuild'
import { type STAGES } from './stages'

export interface BuildStackProps extends StackProps {
  repo: string
  stage: STAGES
  ssmPrefix: string
  branchName: string
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
  batchBuild?: boolean
  cacheConfig?: Cache
  buildSpecFile?: string
  account?: string
  region?: string
  buildComputeType?: ComputeType
  extraEnv?: Record<string, BuildEnvironmentVariable>
}
