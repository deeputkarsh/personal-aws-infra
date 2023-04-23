import { Duration, type Stack } from 'aws-cdk-lib'
import { type ISecurityGroup, type IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2'
import {
  type ApplicationListener,
  ListenerAction, ListenerCertificate,
  ApplicationLoadBalancer, ApplicationProtocol, type ApplicationTargetGroup
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { ENV_VARS } from '../config'

interface AlbProps {
  vpc: IVpc
  securityGroup: ISecurityGroup
  stage: string
  defaultTargetGroup?: ApplicationTargetGroup
  withTestListner?: boolean
}
export class Alb extends ApplicationLoadBalancer {
  readonly mainListner: ApplicationListener

  readonly testListner: ApplicationListener

  constructor (scope: Stack, id: string, props: AlbProps) {
    const {
      stage, vpc,
      securityGroup,
      defaultTargetGroup,
      withTestListner = false
    } = props
    super(scope, id, {
      vpc,
      idleTimeout: Duration.seconds(600),
      internetFacing: true,
      loadBalancerName: `${stage}-alb`,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      securityGroup
    })
    const defaultResponse = (defaultTargetGroup != null)
      ? ListenerAction.forward([defaultTargetGroup])
      : ListenerAction.fixedResponse(403, {
        contentType: 'text/plain',
        messageBody: 'Access Denied'
      })
    this.mainListner = this.addListener('main-listner', {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      certificates: ENV_VARS.sslCertificates.map((arn) => ListenerCertificate.fromArn(arn)),
      defaultAction: defaultResponse
    })

    if (withTestListner) {
      this.testListner = this.addListener('test-listner', {
        port: 8080,
        protocol: ApplicationProtocol.HTTP,
        defaultAction: defaultResponse
      })
    }

    this.addRedirect({
      sourcePort: 80,
      sourceProtocol: ApplicationProtocol.HTTP,
      targetPort: 443,
      targetProtocol: ApplicationProtocol.HTTPS
    })
  }
}
