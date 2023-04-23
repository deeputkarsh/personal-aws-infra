import { STAGE } from './stages'

const EC2_CODE_DEPLPOY_TAG_MAP = {
  [STAGE.alpha]: 'beta',
  [STAGE.beta]: 'beta',
  [STAGE.uat]: 'uat',
  [STAGE.omega]: 'uat',
  [STAGE.prod]: 'prod'
}

const CODE_DEPLOY_TAG_NAME = 'CodeDeploy-deployment'

export { CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP }
