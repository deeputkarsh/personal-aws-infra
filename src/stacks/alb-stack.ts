import {
  type App, Duration, Stack, type StackProps, Tags
} from 'aws-cdk-lib'
import {
  Peer, Port, SecurityGroup,
  SubnetType, Instance,
  InstanceType, InstanceClass,
  InstanceSize
} from 'aws-cdk-lib/aws-ec2'
import {
  TargetType,
  ApplicationProtocol,
  ApplicationTargetGroup
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'
import { Alb } from '../components/ALB'
import { ENV_VARS } from '../config'
import { CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP } from '../constants/ec2'
import { type VpcStack } from './vpc-stack'
import { type AppConfig } from '../constants/application-config'
import { COMMON } from '../constants/ssm'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Role } from 'aws-cdk-lib/aws-iam'

interface AlbStackProps extends StackProps {
  vpcStack: VpcStack
  stage: string
}
interface InstanceMap {
  appServer: Instance
}

export class AlbStack extends Stack {
  readonly alb: Alb

  readonly securityGroups: Record<string, SecurityGroup>

  readonly targetGrp: ApplicationTargetGroup

  readonly instances: InstanceMap

  constructor (scope: App, id: string, props: AlbStackProps) {
    super(scope, id, props)
    const {
      vpcStack, stage
    } = props
    const vpc = vpcStack.vpc

    const albSecurityGroup = new SecurityGroup(this, 'alb-security-group', {
      vpc,
      securityGroupName: `${stage}-alb-sg`
    })
    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443))
    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80))
    this.securityGroups = { alb: albSecurityGroup }
    const instanceSecurityGroup = new SecurityGroup(this, 'app-server-security-group', {
      vpc,
      securityGroupName: `${stage}-app-server-sg`
    })
    instanceSecurityGroup.addIngressRule(
      Peer.securityGroupId(albSecurityGroup.securityGroupId),
      Port.allTcp()
    )
    this.securityGroups.server = instanceSecurityGroup
    const appServer = new Instance(this, 'main-instance', {
      vpc,
      instanceName: `${stage}-server`,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
      machineImage: ENV_VARS.instanceImage,
      securityGroup: instanceSecurityGroup,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      role: Role.fromRoleArn(this, 'ec2-role', StringParameter.valueForStringParameter(this, COMMON['ec2-iam-role']), { mutable: false })
    })
    appServer.addSecurityGroup(vpcStack.securityGroups.ssh)
    Tags.of(appServer).add(CODE_DEPLOY_TAG_NAME, EC2_CODE_DEPLPOY_TAG_MAP[stage])

    this.instances = { appServer }

    const targetGrpOptions = {
      vpc,
      targetType: TargetType.INSTANCE,
      protocol: ApplicationProtocol.HTTP,
      deregistrationDelay: Duration.seconds(10),
      // stickinessCookieDuration: Duration.days(1),
      targets: [new InstanceTarget(appServer)]
    }
    const defaultTargetGroup = new ApplicationTargetGroup(this, 'default-tg', {
      // targetGroupName: 'default-tg',
      port: 3000,
      ...targetGrpOptions
    })
    const withTestListner = false
    this.alb = new Alb(this, 'alb', {
      vpc,
      stage,
      withTestListner,
      defaultTargetGroup,
      securityGroup: albSecurityGroup
    })
  }

  addTargetApplication (appConfig: AppConfig): void {
    const {
      appName, conditions, port, priority,
      healthCheckPath
    } = appConfig
    this.alb.mainListner.addTargets(appName, {
      conditions,
      priority,
      healthCheck: {
        // port: String(port),
        path: healthCheckPath
        // interval: Duration.seconds(10),
        // timeout: Duration.seconds(5) // healthCheckTimeout
      },
      port,
      protocol: ApplicationProtocol.HTTP,
      deregistrationDelay: Duration.seconds(10),
      targets: [new InstanceTarget(this.instances.appServer)]
    })
  }
}
