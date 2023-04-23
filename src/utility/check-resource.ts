import { CloudWatchLogs, IAM, S3 } from 'aws-sdk'
import { ENV_VARS } from '../config'
import { getAllResources } from './cloudformation'

const s3 = new S3()
const iam = new IAM()
const cloudwatchlogs = new CloudWatchLogs({ region: ENV_VARS.region })

export const FindResource = {
  async checkIfResourceDetached (resourceName: string) {
    const allResources = await getAllResources(resourceName)
    const specificRes = allResources?.find(({
      PhysicalResourceId
    }) => PhysicalResourceId === resourceName)
    if (specificRes != null) {
      return false
    }
    console.log('detached resource is imported', resourceName)
    return true
  },
  async checkIfRoleExists (RoleName: string) {
    const role = (await iam.getRole({ RoleName }).promise().catch(() => ({ Role: undefined }))).Role
    const roleExists = Boolean(role)
    if (roleExists) {
      return await this.checkIfResourceDetached(RoleName)
    }
    return false
  },
  async checkIfBucketExists (bucketName: string) {
    const bucketList = await s3.listBuckets().promise()
    const bucketNames = bucketList.Buckets?.map(({ Name }) => Name ?? '')
    const bucketExists = Boolean(bucketNames?.find(name => name === bucketName))
    if (bucketExists) {
      return await this.checkIfResourceDetached(bucketName)
    }
    return false
  },
  async checkIfLogGroupExists (logGroupName: string) {
    const [result] = await cloudwatchlogs.describeLogGroups({
      logGroupNamePrefix: logGroupName
    }).promise().then(({ logGroups }) => logGroups ?? [])
    if (result?.logGroupName === logGroupName) {
      return await this.checkIfResourceDetached(logGroupName)
    }
    return false
  }
}
