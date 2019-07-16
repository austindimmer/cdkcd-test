#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkcdTestStack } from '../lib/cdkcd-test-stack';
import { PipelineStack } from '../lib/pipeline';
import { WebApp } from '../lib/web-app';

const app = new cdk.App();

const PIPELINE_ACCOUNT = '585695036304';
const ANOTHER_ACCOUNT = '138197434366';

new PipelineStack(app, 'CdkcdPipeline', {
  env: { region: 'us-east-1', account: PIPELINE_ACCOUNT },
  stacks: [
    new WebApp(app, 'CdkcdWebApp', { env: { region: 'eu-west-2', account: ANOTHER_ACCOUNT } }),
    new CdkcdTestStack(app, 'CdkcdTestStack1', { env: { region: 'us-west-2', account: PIPELINE_ACCOUNT } }),
    new CdkcdTestStack(app, 'CdkcdTestStack2', { env: { region: 'us-east-1', account: PIPELINE_ACCOUNT } }),
    new CdkcdTestStack(app, 'CdkcdTestStack3', { env: { region: 'us-east-1', account: ANOTHER_ACCOUNT } }),
    new CdkcdTestStack(app, 'CdkcdTestStack4', { env: { region: 'eu-west-1', account: ANOTHER_ACCOUNT } }),
  ]
});

