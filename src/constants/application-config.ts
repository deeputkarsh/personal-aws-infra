import { Duration } from 'aws-cdk-lib'
import { ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2'

const HOSTS = {
  cms: 'cms.utkarshdeep.dev',
  resumeApp: 'resume.utkarshdeep.dev',
  portfolioApp: 'utkarshdeep.dev'
}
export interface AppConfig {
  repo: string
  appName: string
  buildType: string
  priority: number
  port: number
  healthCheckPath: string
  healthCheckTimeout: Duration
  conditions: [ListenerCondition]

}
export const APP_CONFIG_MAP: Record<string, AppConfig> = {
  cms: {
    repo: 'cms',
    appName: 'cms',
    buildType: 'ec2',
    priority: 100,
    port: 1337,
    healthCheckPath: '/',
    healthCheckTimeout: Duration.minutes(5),
    conditions: [ListenerCondition.hostHeaders([HOSTS.cms])]
  },
  resumeApp: {
    repo: 'resume-app',
    appName: 'resume-app',
    buildType: 'ec2',
    priority: 500,
    port: 2000,
    healthCheckPath: '/',
    healthCheckTimeout: Duration.minutes(5),
    conditions: [ListenerCondition.hostHeaders([HOSTS.resumeApp])]
  },
  portfolioApp: {
    repo: 'portfolio-app',
    appName: 'portfolio-app',
    buildType: 'ec2',
    priority: 1000,
    port: 4000,
    healthCheckPath: '/',
    healthCheckTimeout: Duration.minutes(5),
    conditions: [ListenerCondition.hostHeaders([HOSTS.portfolioApp])]
  }
}
export type appNames = keyof typeof APP_CONFIG_MAP
export const applications: appNames[] = Object.keys(APP_CONFIG_MAP)
  .filter(appKey => appKey !== 'portfolioApp')
