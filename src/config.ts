import { GenericLinuxImage } from 'aws-cdk-lib/aws-ec2'
import { type STAGES } from './constants/stages'

const commonEnvs = [
  'stage',
  'ssmPrefix',
  'branchName',
  'securityHeader',
  'acmCertificateId',
  'CDK_DEFAULT_ACCOUNT',
  'AWS_REGION'
]

export const REGIONS = {
  mumbai: 'ap-south-1',
  oregon: 'us-west-2'
}
const regionWiseEnv = {
  [REGIONS.mumbai]: [],
  [REGIONS.oregon]: [
    'vpcCIDR',
    'bastianImage',
    'instanceImage'
  ]
}

type regions = keyof typeof regionWiseEnv

class ValidationError extends Error {
  constructor (message?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const {
  stage = '',
  ssmPrefix = '',
  branchName = '',
  vpcCIDR = '',
  bastianImage = '',
  instanceImage = '',
  securityHeader = '',
  IS_TEMP_ENV = '',
  SCRIPT_TASK = '',
  acmCertificateId,
  CREATE_DISABLED_PIPELINES = '',
  CDK_DEFAULT_ACCOUNT: account = '',
  AWS_REGION: region = ''
} = process.env

export const validateEnv = (): void => {
  const awsRegion = process.env.AWS_REGION
  console.log('validating environment variables')
  if (typeof awsRegion !== 'string' || awsRegion === '') {
    throw new ValidationError('AWS_REGION is required')
  }
  const validRegions = Object.keys(regionWiseEnv)
  if (!validRegions.includes(awsRegion)) {
    throw new ValidationError(`Invalid AWS_REGION expected one of ${JSON.stringify(validRegions)}`)
  }
  const requiredEnvs = [
    ...commonEnvs,
    ...regionWiseEnv[awsRegion as regions]
  ]
  const missingEnv = requiredEnvs.filter((varName) => typeof process.env[varName] === 'undefined')
  if ((missingEnv.length > 0)) {
    throw new ValidationError(`Missing environment variables ${JSON.stringify(missingEnv)}`)
  }
  console.log('found a valid environment')
}

export const ENV_VARS = {
  account,
  region,
  stage: stage as STAGES,
  isTempEnv: IS_TEMP_ENV === 'true',
  ssmPrefix,
  branchName,
  vpcCIDR,
  bastianImage: new GenericLinuxImage({ [region]: bastianImage }),
  instanceImage: new GenericLinuxImage({ [region]: instanceImage }),
  acmCertificateId,
  sslCertificates: [`arn:aws:acm:${region}:${account}:certificate/${acmCertificateId ?? ''}`],
  securityHeader,
  DISABLED_PIPELINES: CREATE_DISABLED_PIPELINES === 'true'
}

export const TASKS = {
  TEST: 'TEST',
  SSM_COPY_REGION: 'SSM_COPY_REGION',
  FIND_SSM_VALUE: 'FIND_SSM_VALUE',
  CHECK_CLOUDFORMATION: 'CHECK_CLOUDFORMATION',
  CHECK_EBS_SNAPSHOTS: 'CHECK_EBS_SNAPSHOTS',
  TAG_RESOURCES_S3: 'TAG_RESOURCES_S3',
  GH_DELETE_STALE_BRANCH: 'GH_DELETE_STALE_BRANCH'
}
export const SCRIPT_CONFIG = {
  TASK_NAME: TASKS[SCRIPT_TASK as keyof typeof TASKS] ?? TASKS.FIND_SSM_VALUE
}
