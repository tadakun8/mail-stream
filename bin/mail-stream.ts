#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MailStreamStack } from '../lib/mail-stream-stack';

const app = new cdk.App();
new MailStreamStack(app, 'MailStreamStack');
