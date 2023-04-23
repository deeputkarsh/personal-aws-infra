import { CloudFormation } from 'aws-sdk'
import { ENV_VARS } from '../config'
import { type StackResources } from 'aws-sdk/clients/cloudformation'

const cf = new CloudFormation({ region: ENV_VARS.region })

export const getAllResources = async (PhysicalResourceId: string): Promise<StackResources | undefined> => await cf
  .describeStackResources({ PhysicalResourceId }).promise()
  .then(({ StackResources }) => StackResources)
  .catch(() => undefined)
