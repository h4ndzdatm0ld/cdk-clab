import cdk = require('aws-cdk-lib');
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Key } from 'aws-cdk-lib/aws-kms';
import { KeyPair } from 'cdk-ec2-key-pair';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Vars } from './constants';


export class ClabVPC extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly vars: Vars;
  public readonly sshKey?: KeyPair;
  public readonly kmsKey?: Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new Construct scope within this Stack
    const constructScope = new Construct(this, 'ConstructScope');

    // Load the vars.yml file
    this.vars = yaml.load(fs.readFileSync('./lib/vars.yml', 'utf8').toString()) as Vars;

    // VPC
    this.vpc = new ec2.Vpc(constructScope, 'ContainerLab-VPC', {
      vpcName: 'ContainerLab-VPC',
      maxAzs: 2, // Default is all AZs in region
    });

    if (this.vars.ssh.allowInboundSSH) {
      // Create KMS Key
      this.kmsKey = new Key(this, 'KMS-key', {
        description: 'KMS key used to encrypt private keys',
        enableKeyRotation: true,
      });

      // Create the Key Pair
      this.sshKey = new KeyPair(constructScope, 'KeyPair', {
        name: 'ec2-keypair',
        description: 'Key Pair for SSH access',
        storePublicKey: true,
        kms: this.kmsKey,
      });

      // Export VPC ID
      new cdk.CfnOutput(constructScope, 'VPCID', {
        value: this.vpc.vpcId,
        exportName: 'ContainerLab-VPC-ID',
      });
    }
  }
}
