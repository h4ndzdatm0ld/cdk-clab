#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkClabStack } from '../lib/cdk-clab-ec2-stack';
import { ClabVPC } from '../lib/cdk-clab-vpc-stack';

const app = new cdk.App();

// Create ClabVPC stack
const vpcStack = new ClabVPC(app, 'CdkClabVPCStack');

// Pass vpcStack to CdkClabStack
new CdkClabStack(app, 'CdkClabEc2Stack', vpcStack);
