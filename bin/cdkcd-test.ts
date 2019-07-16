#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkcdTestStack } from '../lib/cdkcd-test-stack';
import { PipelineStack } from '../lib/pipeline';

const app = new cdk.App();

new PipelineStack(app, 'CdkcdPipeline', { env: { region: 'us-east-1', account: '585695036304' }});

new CdkcdTestStack(app, 'CdkcdTestStack1', { env: { region: 'us-west-2', account: '585695036304' }});
new CdkcdTestStack(app, 'CdkcdTestStack2', { env: { region: 'us-east-1', account: '585695036304' }});
new CdkcdTestStack(app, 'CdkcdTestStack3', { env: { region: 'us-east-1', account: '138197434366' }});
new CdkcdTestStack(app, 'CdkcdTestStack4', { env: { region: 'eu-west-1', account: '138197434366' }});
