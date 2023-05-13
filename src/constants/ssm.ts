// import { ENV_VARS } from '../config'

export const COMMON = {
  'sls-bucket': '/SERVERLESS/DEPLOYMENT_BUCKET',
  'code-pipeline-bucket': '/CODE_PIPELINE/BUCKET',
  SECURITY_GROUP: '/SERVERLESS/SECURITY_GROUP',
  SUBNET_1: '/SERVERLESS/SUBNET_1',
  SUBNET_2: '/SERVERLESS/SUBNET_2',
  'ec2-iam-role': '/ROLES/EC2',
  'code-build-role': '/ROLES/CODE_BUILD',
  'code-pipeline-role': '/ROLES/CODE_PIPELINE',
  'code-deploy-role': '/ROLES/CODE_DEPLOY',
  /* REDIS_HOST: `${ENV_VARS.ssmPrefix}/REDIS/HOST`,
  REDIS_PORT: `${ENV_VARS.ssmPrefix}/REDIS/PORT`,
  MYSQL_HOST: `${ENV_VARS.ssmPrefix}/MYSQL/HOST`,*/
  REDIS_HOST: '/REDIS/HOST',
  REDIS_PORT: '/REDIS/PORT',
  MYSQL_HOST: '/MYSQL/HOST',
  MYSQL_USER: '/MYSQL/USER',
  MYSQL_PASSWORD: '/MYSQL/PASSWORD',
  MYSQL_DATABASE: '/MYSQL/DATABASE',
  MYSQL_SNAPSHOT: '/MYSQL/SNAPSHOT_ID'
}

export type AvailableSSM = keyof typeof COMMON
