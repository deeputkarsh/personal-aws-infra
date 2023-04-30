import { type App, Stack, type StackProps } from 'aws-cdk-lib'
import {
  Peer, Port, SecurityGroup, type Vpc
} from 'aws-cdk-lib/aws-ec2'
import { CfnCacheCluster, CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { COMMON } from '../constants/ssm'

interface RedisStackProps extends StackProps {
  vpc: Vpc
  stage: string
}

export class RedisStack extends Stack {
  readonly cluster: CfnCacheCluster

  readonly subnetGroup: CfnSubnetGroup

  readonly redisSecurityGrp: SecurityGroup

  readonly ssmParams: StringParameter[]

  constructor (scope: App, id: string, props: RedisStackProps) {
    super(scope, id, props)
    const { vpc, stage } = props
    this.redisSecurityGrp = new SecurityGroup(this, 'redis-security-group', {
      vpc,
      securityGroupName: `${stage}-redis-sg`
    })
    this.redisSecurityGrp.addIngressRule(Peer.anyIpv4(), Port.tcp(6379))

    this.subnetGroup = new CfnSubnetGroup(this, 'subnet-grp', {
      description: 'Private subnet group',
      cacheSubnetGroupName: 'private-subnet-grp',
      subnetIds: vpc.privateSubnets.map(({ subnetId }) => subnetId)
    })
    this.cluster = new CfnCacheCluster(this, 'redis-cluster', {
      cacheNodeType: 'cache.t3.small',
      engine: 'redis',
      clusterName: `${stage}-uae-redis`,
      numCacheNodes: 1,
      autoMinorVersionUpgrade: true,
      cacheSubnetGroupName: this.subnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [this.redisSecurityGrp.securityGroupId]
    })
    this.cluster.node.addDependency(this.subnetGroup)
    this.cluster.node.addDependency(this.redisSecurityGrp)
    this.ssmParams = [
      new StringParameter(this, 'redis-host', {
        stringValue: this.cluster.attrRedisEndpointAddress,
        parameterName: COMMON.REDIS_HOST
      }),
      new StringParameter(this, 'redis-port', {
        stringValue: this.cluster.attrRedisEndpointPort,
        parameterName: COMMON.REDIS_PORT
      })
    ]
    this.ssmParams[0].node.addDependency(this.cluster)
    this.ssmParams[1].node.addDependency(this.cluster)
  }
}
