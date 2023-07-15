import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BARE_METAL_INSTANCE_TYPES } from './constants';
import { ClabVPC } from './cdk-clab-vpc-stack';
import * as fs from 'fs';


export class CdkClabStack extends cdk.Stack {
  constructor(scope: Construct, id: string, vpcStack: ClabVPC, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get the vars and VPC from ClabVPC stack
    const vars = vpcStack.vars;
    const vpc = vpcStack.vpc;
    const sshKey = vpcStack.sshKey;

    if (vars.nestedVirt) {
      if (!BARE_METAL_INSTANCE_TYPES.includes(vars.ec2Instance.instanceType)) {
        throw new Error(`Invalid instance type for 'nestedVirt'. If enabled, bare metal instance type must be defined.`);
      }
    }

    // Define the IAM role
    const role = new iam.Role(this, 'Role', {
      roleName: 'containerlab-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // Define the security group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: 'ContainerLabSSHAccess',
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true,   // outbound internet access
    });

    // Add SSH Inbound Access if allowed
    vars.ssh.allowInboundSSH && vars.ssh.allowInboundSSHFrom.forEach(ip =>
      securityGroup.addIngressRule(ec2.Peer.ipv4(ip), ec2.Port.tcp(22), `Allow SSH Inbound SSH Access from ${ip}`)
    );

    // Prepare the userData script
    const dockerPullCommands = vars.images.map((image: string) => `docker pull ${image}`).join('\n');
    const userDataScript = fs.readFileSync('lib/cloud-init.sh', 'utf8')
      .replace('{{DOCKER_COMPOSE_VERSION}}', vars.dockerComposeVersion)
      .replace('{{DOCKER_PULL_COMMANDS}}', dockerPullCommands)
      .replace(/{{CONTAINERLAB_VERSION}}/g, vars.containerLabVersion)
      .replace('{{REPO_URL}}', vars.repository.url)
      .replace('{{REPO_DIR}}', vars.repository.dir)
      .replace('{{ALLOW_INBOUND_SSH}}', vars.ssh.allowInboundSSH)
    const userData = ec2.UserData.custom(userDataScript);

    console.log("The user data which will be used to create your instance.")
    console.log(userData.render())

    // Define the EC2 instance properties
    let instanceProps: ec2.InstanceProps = {
      instanceName: 'containerlab',
      vpc,
      instanceType: new ec2.InstanceType(vars.ec2Instance.instanceType),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup: securityGroup,
      role: role,
      userData: userData,
    };

    // Conditionally add keyName to instanceProps if SSH inbound is allowed
    if (vars.ssh.allowInboundSSH && sshKey) {
      instanceProps = { ...instanceProps, keyName: sshKey.keyPairName };
      // Grant read access to the private key to a role or user
      // Assuming roleOrUser is the IAM Role or User that needs to have read access
      sshKey.grantReadOnPrivateKey(role);
    }

    const instance = new ec2.Instance(this, 'containerLabBox', instanceProps);

    // Output the Instance's public IP address and SSH connection command
    new cdk.CfnOutput(this, 'InstancePublicIp', {
      value: instance.instancePublicIp,
    });
    new cdk.CfnOutput(this, 'SshCommand', {
      value: `ssh -i ${vars.ssh.privateKeyPath} ec2-user@${instance.instancePublicIp}`,
    });
  }
}
