import cb = require('@aws-cdk/aws-codebuild');
import { Environment, Construct } from '@aws-cdk/core';
import { PolicyStatement } from '@aws-cdk/aws-iam';

export interface DeployProjectProps {
  readonly stackName: string;
  readonly frameworkVersion?: string;
  readonly env?: Environment;
}

const EXTERNAL_ID = 'AWS::CDK::DEPLOY::021D8AD7C55D49598C82ACB6BFC30F1B';

export class DeployProject extends cb.PipelineProject {
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
