import { type App, Stack, type StackProps } from 'aws-cdk-lib'
import {
  IpAddresses,
  Peer, Port, SecurityGroup,
  SubnetType, Vpc
} from 'aws-cdk-lib/aws-ec2'
import { type StringParameter } from 'aws-cdk-lib/aws-ssm'
import { ENV_VARS } from '../config'

interface VpcStackProps extends StackProps {
  stage: string
}
interface SgMap {
  ssh: SecurityGroup
  lambda: SecurityGroup
}

export class VpcStack extends Stack {
  readonly vpc: Vpc

  readonly ssmParams: StringParameter[]

  readonly securityGroups: SgMap

  constructor (scope: App, id: string, props: VpcStackProps) {
    super(scope, id, props)
    const { stage } = props

    const cidr = ENV_VARS.vpcCIDR
    this.vpc = new Vpc(this, 'vpc', {
      ipAddresses: IpAddresses.cidr(cidr),
      maxAzs: 3,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'publicSubnet',
        subnetType: SubnetType.PUBLIC
      }]
    })

    const sshSecurityGroup = new SecurityGroup(this, 'ssh-security-group', {
      vpc: this.vpc,
      securityGroupName: `${stage}-open-ssh`
    })
    sshSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22))
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-security-group', {
      vpc: this.vpc,
      securityGroupName: `${stage}-lambda-sg`
    })
    this.securityGroups = { ssh: sshSecurityGroup, lambda: lambdaSecurityGroup }
  }
}
