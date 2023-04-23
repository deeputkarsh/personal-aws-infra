import {
  App, type AppProps, type Environment, type Stack
} from 'aws-cdk-lib'
import { ENV_VARS } from './config'
import { type STAGES } from './constants/stages'
import { AlbStack } from './stacks/alb-stack'
import { VpcStack } from './stacks/vpc-stack'

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

  createStacks (): Stack[] {
    const {
      stage,
      ssmPrefix
      // branchName
    } = this.envVars
    const env = this.stackEnv

    const stacks: Stack[] = []
    const vpcStack = new VpcStack(this, `${this.stackNamePrefix}-vpc`, {
      env,
      stage,
      ssmPrefix
    })
    const albStack = new AlbStack(this, `${this.stackNamePrefix}-alb`, {
      env,
      stage,
      vpc: vpcStack.vpc
    })
    stacks.push(vpcStack)
    stacks.push(albStack)
    return stacks
  }
}
