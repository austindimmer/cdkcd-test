import cp = require('@aws-cdk/aws-codepipeline');
import cpa = require('@aws-cdk/aws-codepipeline-actions');
import cb = require('@aws-cdk/aws-codebuild');
import { SecretValue, Construct, Stack, StackProps } from '@aws-cdk/core';
import { DeployAction } from './deploy-action';

export interface PipelineStackProps extends StackProps {
  readonly stacks: Stack[];
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
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
        new DeployAction(this, 'deploy-pipeline', {
          assembly: assembly,
          stackName: this.stackName
        })
      ]
    });

    pipeline.addStage({
      stageName: 'deploy',
      actions: props.stacks.map(stack => new DeployAction(this, `deploy-${stack.stackName}`, {
        stackName: stack.stackName,
        env: { account: stack.account, region: stack.region },
        assembly: assembly,
      }))
    });
  };
}
