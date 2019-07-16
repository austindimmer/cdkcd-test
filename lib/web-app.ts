import { Stack, Construct, StackProps } from '@aws-cdk/core';
import ecsp = require('@aws-cdk/aws-ecs-patterns');
import ecs = require('@aws-cdk/aws-ecs');
import ec2 = require('@aws-cdk/aws-ec2');

export class WebApp extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc');
    const cluster = new ecs.Cluster(this, 'cluster', { vpc: vpc });

    new ecsp.LoadBalancedFargateService(this, 'service', {
      image: ecs.ContainerImage.fromAsset(__dirname + '/../image'),
      cluster: cluster
    });
  }
}