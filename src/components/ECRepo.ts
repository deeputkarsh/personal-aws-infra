import { RemovalPolicy, type Stack } from 'aws-cdk-lib'
import {
  Repository, RepositoryEncryption, TagMutability, TagStatus
} from 'aws-cdk-lib/aws-ecr'

interface RepoProps {
  repositoryName: string
  account: string
}

export class ECRepo extends Repository {
  constructor (scope: Stack, id: string, { repositoryName, account }: RepoProps) {
    super(scope, id, {
      repositoryName,
      removalPolicy: RemovalPolicy.DESTROY,
      imageScanOnPush: true,
      encryption: RepositoryEncryption.AES_256,
      imageTagMutability: TagMutability.MUTABLE,
      lifecycleRegistryId: account,
      lifecycleRules: [
        {
          description: 'expire old images',
          maxImageCount: 3,
          tagStatus: TagStatus.UNTAGGED
        }
      ]
    })
  }
}
