import { type App, Stack, type StackProps } from 'aws-cdk-lib'
import {
  Peer, Port, SecurityGroup,
  SubnetType, Vpc, BastionHostLinux,
  InstanceType, InstanceClass, InstanceSize, CfnEIP
} from 'aws-cdk-lib/aws-ec2'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { ENV_VARS } from '../config'
import { COMMON } from '../constants/ssm'

interface VpcStackProps extends StackProps {
  stage: string
  ssmPrefix: string
}

export class VpcStack extends Stack {
  readonly vpc: Vpc

  readonly bastion: BastionHostLinux

  readonly bastianIP: CfnEIP

  readonly ssmParams: StringParameter[]

  readonly securityGroups: SecurityGroup[]

  constructor (scope: App, id: string, props: VpcStackProps) {
    super(scope, id, props)
    const {
      stage,
      ssmPrefix
    } = props

    const cidr = ENV_VARS.vpcCIDR
    this.vpc = new Vpc(this, 'vpc', {
      cidr,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'publicSubnet',
          subnetType: SubnetType.PUBLIC
        }, {
          cidrMask: 20,
          name: 'privateSubnet',
          subnetType: SubnetType.PRIVATE_WITH_NAT
        }],
      natGateways: 1
    })

    const sshSecurityGroup = new SecurityGroup(this, 'ssh-security-group', {
      vpc: this.vpc,
      securityGroupName: `${stage}-open-ssh`
    })
    sshSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22))
    this.securityGroups = [sshSecurityGroup]

    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-security-group', {
      vpc: this.vpc,
      securityGroupName: `${stage}-lambda-sg`
    })
    this.securityGroups.push(lambdaSecurityGroup)

    this.bastion = new BastionHostLinux(this, 'bastian-host', {
      vpc: this.vpc,
      instanceName: 'bastian-host',
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: ENV_VARS.bastianImage,
      securityGroup: sshSecurityGroup,
      subnetSelection: { subnetType: SubnetType.PUBLIC }
    })
    this.bastianIP = new CfnEIP(this, 'bastian-ip', {
      domain: 'vpc',
      instanceId: this.bastion.instanceId
    })
    const [subnet1, subnet2] = this.vpc.privateSubnets
    this.ssmParams = [
      new StringParameter(this, 'ssm-security-grp', {
        stringValue: lambdaSecurityGroup.securityGroupId,
        parameterName: `${ssmPrefix}/${COMMON.SECURITY_GROUP}`
      }),
      new StringParameter(this, 'ssm-subnet-1', {
        stringValue: subnet1.subnetId,
        parameterName: `${ssmPrefix}/${COMMON.SUBNET_1}`
      }),
      new StringParameter(this, 'ssm-subnet-2', {
        stringValue: subnet2.subnetId,
        parameterName: `${ssmPrefix}/${COMMON.SUBNET_2}`
      })
    ]
  }
}
