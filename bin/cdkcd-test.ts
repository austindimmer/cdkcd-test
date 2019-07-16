#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkcdTestStack } from '../lib/cdkcd-test-stack';

const app = new cdk.App();
new CdkcdTestStack(app, 'CdkcdTestStack1', { env: { region: 'us-west-2', account: '585695036304' }});
new CdkcdTestStack(app, 'CdkcdTestStack2', { env: { region: 'us-east-1', account: '138197434366' }});
