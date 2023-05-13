import { type App, Stack, type StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib'
import {
  InstanceClass, InstanceSize,
  InstanceType, Peer, Port,
  SecurityGroup, SubnetType
} from 'aws-cdk-lib/aws-ec2'
import {
  DatabaseInstanceEngine, DatabaseInstanceFromSnapshot,
  MysqlEngineVersion, StorageType, SubnetGroup
} from 'aws-cdk-lib/aws-rds'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { COMMON } from '../constants/ssm'
import { type VpcStack } from './vpc-stack'
import { ENV_VARS } from '../config'

interface RDSStackProps extends StackProps {
  vpcStack: VpcStack
  stage: string
}

export class RDSStack extends Stack {
  readonly instance: DatabaseInstanceFromSnapshot

  readonly subnetGroups: { public: SubnetGroup/* , private: SubnetGroup */ }

  readonly securityGrp: SecurityGroup

  readonly ssmParams: StringParameter[]

  constructor (scope: App, id: string, props: RDSStackProps) {
    super(scope, id, props)
    const {
      vpcStack, stage
    } = props
    const vpc = vpcStack.vpc
    this.securityGrp = new SecurityGroup(this, 'rds-security-group', {
      vpc,
      securityGroupName: `${stage}-rds-sg`
    })
    this.securityGrp.addIngressRule(Peer.anyIpv4(), Port.tcp(3306))
    const publicSubnetGrp = new SubnetGroup(this, 'public-subnet-grp', {
      subnetGroupName: `${stage}-public-grp`,
      description: `${stage} vpc public subnet grp`,
      vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC }
    })
    /* const privateSubnetGrp = new SubnetGroup(this, 'private-subnet-grp', {
      subnetGroupName: `${stage}-private-grp`,
      description: `${stage} vpc private subnet grp`,
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS }
    }) */
    this.subnetGroups = { public: publicSubnetGrp/* , private: privateSubnetGrp */ }
    this.instance = new DatabaseInstanceFromSnapshot(this, 'rds-instance', {
      vpc,
      engine: DatabaseInstanceEngine.mysql({ version: MysqlEngineVersion.VER_8_0_32 }),
      snapshotIdentifier: StringParameter.valueForStringParameter(this, COMMON.MYSQL_SNAPSHOT), // 'my-db-snapshot',
      instanceIdentifier: 'my-db',
      autoMinorVersionUpgrade: true,
      publiclyAccessible: true,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      storageType: StorageType.GP3,
      subnetGroup: publicSubnetGrp,
      securityGroups: [this.securityGrp],
      deleteAutomatedBackups: true,
      allocatedStorage: 20,
      backupRetention: Duration.days(0),
      removalPolicy: RemovalPolicy.SNAPSHOT
    })
    this.instance.node.addDependency(publicSubnetGrp)

    this.ssmParams = [
      new StringParameter(this, 'mysql-host', {
        stringValue: this.instance.dbInstanceEndpointAddress,
        parameterName: COMMON.MYSQL_HOST
      }),
      new StringParameter(this, 'mysql-user', {
        stringValue: ENV_VARS.MYSQL_USER,
        parameterName: COMMON.MYSQL_USER
      }),
      new StringParameter(this, 'mysql-pass', {
        stringValue: ENV_VARS.MYSQL_PASSWORD,
        parameterName: COMMON.MYSQL_PASSWORD
      }),
      new StringParameter(this, 'mysql-database', {
        stringValue: ENV_VARS.MYSQL_DATABASE,
        parameterName: COMMON.MYSQL_DATABASE
      })
    ]
    this.ssmParams[0].node.addDependency(this.instance)
    this.ssmParams[1].node.addDependency(this.instance)
  }
}
