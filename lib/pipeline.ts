import cp = require('@aws-cdk/aws-codepipeline');
import cpa = require('@aws-cdk/aws-codepipeline-actions');
import cb = require('@aws-cdk/aws-codebuild');
import { SecretValue, Construct, Stack, StackProps } from '@aws-cdk/core';
import { DeployProject } from './deploy-project';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new cp.Pipeline(this, 'pipeline', {
      restartExecutionOnUpdate: true
    });

    const source = new cp.Artifact();

    pipeline.addStage({
      stageName: 'source',
      actions: [
        new cpa.GitHubSourceAction({
          actionName: 'source',
          owner: 'eladb',
          repo: 'cdkcd-test',
          oauthToken: SecretValue.secretsManager('arn:aws:secretsmanager:us-east-1:585695036304:secret:github-token-B5IVBl'),
          output: source
        })
      ]
    });

    const assembly = new cp.Artifact();

    pipeline.addStage({
      stageName: 'build',
      actions: [
        new cpa.CodeBuildAction({
          actionName: 'build',
          input: source,
          project: new cb.PipelineProject(this, 'build', {
            environment: { buildImage: cb.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1 }
          }),
          outputs: [ assembly ]
        })
      ],
    });

    pipeline.addStage({
      stageName: 'pipeline',
      actions: [
        new cpa.CodeBuildAction({
          actionName: 'deploy-pipeline',
          input: assembly,
          project: new DeployProject(this, 'deploy-pipeline', {
            stackName: this.stackName
          })
        })
      ]
    });

    pipeline.addStage({
      stageName: 'deploy',
      actions: [
        new cpa.CodeBuildAction({
          actionName: 'deploy-CdkcdTestStack1',
          input: assembly,
          project: new DeployProject(this, 'deploy-CdkcdTestStack1', {
            stackName: 'CdkcdTestStack1'
          })
        }),
        new cpa.CodeBuildAction({
          actionName: 'deploy-CdkcdTestStack2',
          input: assembly,
          project: new DeployProject(this, 'deploy-CdkcdTestStack2', {
            stackName: 'CdkcdTestStack2'
          })
        }),
        new cpa.CodeBuildAction({
          actionName: 'deploy-CdkcdTestStack3',
          input: assembly,
          project: new DeployProject(this, 'deploy-CdkcdTestStack3', {
            stackName: 'CdkcdTestStack3',
            env: { account: '138197434366' }
          })
        }),
        new cpa.CodeBuildAction({
          actionName: 'deploy-CdkcdTestStack4',
          input: assembly,
          project: new DeployProject(this, 'deploy-CdkcdTestStack4', {
            stackName: 'CdkcdTestStack4',
            env: { account: '138197434366' }
          })
        })
      ]
    });
  };
}
