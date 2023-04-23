import {
  type App, Duration, Stack, type StackProps, Tags
} from 'aws-cdk-lib'
import {
  Peer, Port, SecurityGroup,
  SubnetType, type Vpc, Instance,
  InstanceType, InstanceClass,
  InstanceSize
} from 'aws-cdk-lib/aws-ec2'
import { type Cluster } from 'aws-cdk-lib/aws-ecs'
import {
  TargetType,
  ApplicationProtocol,
  ApplicationTargetGroup
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'
import { Role } from 'aws-cdk-lib/aws-iam'
import { Alb } from '../components/ALB'
import { ENV_VARS } from '../config'
import { CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP } from '../constants/ec2'
// import { SECURITY_HEADER } from '../constants/ecs'
import { APP_INSTANCE_ROLE } from '../constants/roles'

interface AlbStackProps extends StackProps {
  vpc: Vpc
  stage: string
}

export class AlbStack extends Stack {
  readonly alb: Alb

  readonly albSecurityGroup: SecurityGroup

  readonly ecsCluster: Cluster

  readonly ecsSecurityGroup: SecurityGroup

  readonly instanceSecurityGroup: SecurityGroup

  readonly targetGrp: ApplicationTargetGroup

  readonly instances: Instance[]

  constructor (scope: App, id: string, props: AlbStackProps) {
    super(scope, id, props)
    const {
      vpc, stage
    } = props

    this.albSecurityGroup = new SecurityGroup(this, 'alb-security-group', {
      vpc,
      securityGroupName: `${stage}-alb-sg`
    })
    this.albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443))
    this.albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80))
    this.ecsSecurityGroup = new SecurityGroup(this, 'ecs-security-group', {
      vpc,
      securityGroupName: `${stage}-ecs-sg`
    })
    this.ecsSecurityGroup.addIngressRule(
      Peer.securityGroupId(this.albSecurityGroup.securityGroupId),
      Port.allTcp()
    )
    this.instanceSecurityGroup = new SecurityGroup(this, 'app-server-security-group', {
      vpc,
      securityGroupName: `${stage}-app-server-sg`
    })
    this.instanceSecurityGroup.addIngressRule(
      Peer.securityGroupId(this.albSecurityGroup.securityGroupId),
      Port.allTcp()
    )
    this.instanceSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22))
    const appServer = new Instance(this, 'main-instance', {
      vpc,
      instanceName: `${stage}-server`,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      machineImage: ENV_VARS.instanceImage,
      securityGroup: this.instanceSecurityGroup,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_NAT },
      role: Role.fromRoleArn(this, 'ec-role', APP_INSTANCE_ROLE)
    })
    Tags.of(appServer).add(CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP[stage])

    this.instances = [appServer]

    const targetGrpOptions = {
      vpc,
      targetType: TargetType.INSTANCE,
      protocol: ApplicationProtocol.HTTP,
      deregistrationDelay: Duration.seconds(10),
      // stickinessCookieDuration: Duration.days(1),
      targets: [new InstanceTarget(appServer)]
    }
    const defaultTargetGroup = new ApplicationTargetGroup(this, 'default-tg', {
      targetGroupName: 'default-tg',
      port: 80,
      ...targetGrpOptions
    })
    const withTestListner = false
    this.alb = new Alb(this, 'alb', {
      vpc,
      stage,
      withTestListner,
      defaultTargetGroup,
      securityGroup: this.albSecurityGroup
    })

    /* const defaultTarget = {
      priority: 1000,
      conditions: [SECURITY_HEADER],
      targetGroups: [new ApplicationTargetGroup(this, 'default-tg', {
        targetGroupName: 'default-tg',
        port: 80,
        ...targetGrpOptions
      })]
    } */
    // this.alb.mainListner.addTargetGroups('default', defaultTarget)
  }
}
