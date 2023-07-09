import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { BARE_METAL_INSTANCE_TYPES } from './constants';

interface Vars {
  ssmRoleName: string;
  nestedVirt: boolean;
  ec2_instance: {
    instanceType: string;
  };
  images: string[];
  repository: {
    url: string;
    dir: string;
  };
  allowInboundSSH: string
}

export class CdkClabStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Load the vars.yml file
    const vars = yaml.load(fs.readFileSync('./lib/vars.yml', 'utf8').toString()) as Vars;

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2, // Default is all AZs in region
    });

    // If nestedVirt is enabled, set the instance type to a bare metal instance
    if (vars.nestedVirt) {
      if (!BARE_METAL_INSTANCE_TYPES.includes(vars.ec2_instance.instanceType)) {
        console.log(`Invalid instance type for nestedVirt. Defaulting to 'm5.metal'.`);
        vars.ec2_instance.instanceType = 'm5.metal';  // or any other metal instance type
      }
    }


    // Define the IAM role
    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // Define the security group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true,   // outbound internet access
    });

    if (vars.allowInboundSSH) {
      securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from the world');
    }
    // Prepare the userData script
    const dockerPullCommands = vars.images.map((image: string) => `docker pull ${image}`).join('\n');
    let userDataScript = fs.readFileSync('lib/cloud-init.sh', 'utf8');
    userDataScript = userDataScript.replace('{{REPO_URL}}', vars.repository.url);
    userDataScript = userDataScript.replace('{{REPO_DIR}}', vars.repository.dir);
    userDataScript = userDataScript.replace('{{DOCKER_PULL_COMMANDS}}', dockerPullCommands);
    const userData = ec2.UserData.custom(userDataScript);

    // Define the EC2 instance
    const instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: new ec2.InstanceType(vars.ec2_instance.instanceType),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup: securityGroup,
      role: role,
      userData: userData,
    });
  }
}
