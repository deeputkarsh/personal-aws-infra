import {
  App, type AppProps, type Environment, type Stack
} from 'aws-cdk-lib'
import { ENV_VARS } from './config'
import { type STAGES } from './constants/stages'
import { AlbStack } from './stacks/alb-stack'
import { VpcStack } from './stacks/vpc-stack'
import { HelperStack } from './stacks/helper-stack'
import { RDSStack } from './stacks/rds'
import { PipelineEC2Stack } from './stacks/pipeline-ec2'
import { APP_CONFIG_MAP, applications } from './constants/application-config'

interface EnvVars {
  stage: STAGES
  ssmPrefix: string
  branchName: string
}
export default class MainApp extends App {
  readonly envVars: EnvVars

  readonly stackNamePrefix: string

  readonly stackEnv: Environment

  constructor (props?: AppProps) {
    super(props)

    const {
      account, region, stage,
      ssmPrefix, branchName, isTempEnv
    } = ENV_VARS
    this.envVars = {
      stage,
      ssmPrefix,
      branchName
    }
    this.stackNamePrefix = `${isTempEnv ? 'temp-' : ''}${stage}`
    this.stackEnv = { account, region }
  }

  createStacks (): Record<string, Stack> {
    const {
      stage,
      ssmPrefix,
      branchName
    } = this.envVars
    const env = this.stackEnv

    const stacks: Record<string, Stack> = {}
    stacks.vpc = new VpcStack(this, `${this.stackNamePrefix}-vpc`, {
      env,
      stage
    })
    stacks.rds = new RDSStack(this, `${this.stackNamePrefix}-rds`, {
      env,
      stage,
      vpcStack: stacks.vpc as VpcStack
    })
    stacks.helper = new HelperStack(this, 'helper-stack', { env })
    const albStack = new AlbStack(this, `${this.stackNamePrefix}-alb`, {
      env,
      stage,
      vpcStack: stacks.vpc as VpcStack
    })
    stacks.alb = albStack
    applications.forEach((appKey) => {
      const appConfig = APP_CONFIG_MAP[appKey]
      const { repo, appName } = appConfig
      stacks[appKey] = new PipelineEC2Stack(this, `${this.stackNamePrefix}-${appName}`, {
        env,
        stage,
        ssmPrefix,
        repo,
        branchName
      })
      albStack.addTargetApplication(appConfig)
    })
    /* stacks.portfolioApp = new PipelineEC2Stack(this, `${this.stackNamePrefix}-portfolio-app`, {
      env,
      stage,
      ssmPrefix,
      repo: 'portfolio-app',
      branchName,
      helperStack: stacks.helper as HelperStack
    }) */
    return stacks
  }
}
