// import { ENV_VARS } from '../config'

export const COMMON = {
  SERVERLESS_DEPLOYMENT_BUCKET: '/SERVERLESS/DEPLOYMENT_BUCKET',
  SECURITY_GROUP: '/SERVERLESS/SECURITY_GROUP',
  SUBNET_1: '/SERVERLESS/SUBNET_1',
  SUBNET_2: '/SERVERLESS/SUBNET_2',
  /* REDIS_HOST: `${ENV_VARS.ssmPrefix}/REDIS/HOST`,
  REDIS_PORT: `${ENV_VARS.ssmPrefix}/REDIS/PORT`,
  MYSQL_HOST: `${ENV_VARS.ssmPrefix}/MYSQL/HOST`,
  MYSQL_PORT: `${ENV_VARS.ssmPrefix}/MYSQL/PORT`, */
  REDIS_HOST: '/REDIS/HOST',
  REDIS_PORT: '/REDIS/PORT',
  MYSQL_HOST: '/MYSQL/HOST',
  MYSQL_PORT: '/MYSQL/PORT',
  MYSQL_SNAPSHOT: '/MYSQL/SNAPSHOT_ID'
}
