import cp = require('@aws-cdk/aws-codepipeline');
import cpa = require('@aws-cdk/aws-codepipeline-actions');
import cb = require('@aws-cdk/aws-codebuild');
import iam = require('@aws-cdk/aws-iam');
import { SecretValue, Construct, Stack, StackProps, Environment } from '@aws-cdk/core';
import { PolicyStatement } from '@aws-cdk/aws-iam';

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
        })
      ]
    });
  };
}

interface DeployProjectProps {
  readonly stackName: string;
  readonly frameworkVersion?: string;
  readonly env?: Environment;
}

const EXTERNAL_ID = 'AWS::CDK::DEPLOY::021D8AD7C55D49598C82ACB6BFC30F1B';

class DeployProject extends cb.PipelineProject {
  constructor(scope: Construct, id: string, props: DeployProjectProps) {
    const versionSpec = props.frameworkVersion ? `@${props.frameworkVersion}` : '';
    const assumeRoleCommands = new Array<string>();

    if (props.env && props.env.account) {
      const roleArn = `arn:aws:iam::${props.env.account}:role/aws-cdk-deployment`;
      const sessionName = scope.node.uniqueId + '.' + id;
      assumeRoleCommands.push(`aws sts assume-role --role-arn="${roleArn}" --role-session-name ${sessionName} --external-id ${EXTERNAL_ID} > /tmp/aws-creds.json`);
      assumeRoleCommands.push(`export AWS_ACCESS_KEY_ID=$(node -p "require('/tmp/aws-creds.json').Credentials.AccessKeyId")`);
      assumeRoleCommands.push(`export AWS_SECRET_ACCESS_KEY=$(node -p "require('/tmp/aws-creds.json').Credentials.SecretAccessKey")`);
      assumeRoleCommands.push(`export AWS_SESSION_TOKEN=$(node -p "require('/tmp/aws-creds.json').Credentials.SessionToken")`);
    }

    if (props.env && props.env.region) {
      assumeRoleCommands.push(`export AWS_REGION=${props.env.region}`);
    }

    super(scope, id, {
      environment: { buildImage: cb.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1 },
      buildSpec: cb.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              ...assumeRoleCommands,
              `npx "cdk${versionSpec}" deploy --app . -e ${props.stackName}`
            ]
          }
        }
      })
    });

    // admin
    this.addToRolePolicy(new PolicyStatement({
      resources: [ '*' ],
      actions: [ '*' ]
    }));
  }
}
