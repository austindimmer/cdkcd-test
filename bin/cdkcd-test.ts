#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkcdTestStack } from '../lib/cdkcd-test-stack';
import iam = require('@aws-cdk/aws-iam');
import { Stack, Construct, StackProps } from '@aws-cdk/core';

const app = new cdk.App();
new CdkcdTestStack(app, 'CdkcdTestStack1', { env: { region: 'us-west-2', account: '585695036304' }});
new CdkcdTestStack(app, 'CdkcdTestStack2', { env: { region: 'us-east-1', account: '585695036304' }});
// new CdkcdTestStack(app, 'CdkcdTestStack2', { env: { region: 'us-east-1', account: '138197434366' }});

// class BootstrapStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);

//     new iam.Role(this, 'deployment-role', {
//       assumedBy: iam.ServicePrincipal('')
//     })

//   }
// }