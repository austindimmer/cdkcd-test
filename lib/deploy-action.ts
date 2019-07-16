import cb = require('@aws-cdk/aws-codebuild');
import { Environment, Construct } from '@aws-cdk/core';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import cp = require('@aws-cdk/aws-codepipeline');
import cpa = require('@aws-cdk/aws-codepipeline-actions');

export interface DeployActionProps {
  readonly actionName?: string;
  readonly assembly: cp.Artifact;
  readonly stackName: string;
  readonly frameworkVersion?: string;
  readonly env?: Environment;
}

export class DeployAction extends Construct implements cp.IAction {
  private readonly action: cpa.CodeBuildAction;

  constructor(scope: Construct, id: string, props: DeployActionProps) {
    super(scope, id);

    this.action = new cpa.CodeBuildAction({
      actionName: props.actionName || id,
      input: props.assembly,
      project: new DeployProject(this, 'deploy-project', {
        stackName: props.stackName,
        env: props.env,
        frameworkVersion: props.frameworkVersion
      })
    });
  }

  public get actionProperties(): cp.ActionProperties {
    return this.action.actionProperties;
  }

  public bind(scope: Construct, stage: cp.IStage, options: cp.ActionBindOptions): cp.ActionConfig {
    return this.action.bind(scope, stage, options);
  }

  public onStateChange(name: string, target?: import("@aws-cdk/aws-events").IRuleTarget, options?: import("@aws-cdk/aws-events").RuleProps): import("@aws-cdk/aws-events").Rule {
    return this.action.onStateChange(name, target, options);
  }
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
              `npx "cdk${versionSpec}" deploy --require-approval=never --app . -e ${props.stackName}`
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
