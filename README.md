# CDK - ContainerLab in the Cloud. Security First.

Deploy a ContainerLab environment in the cloud using AWS CDK. Leverage AWS SSM tools to access your instances. SSH is not enabled by default but can be enabled via the `vars.yml` file.

This project allows for bare metal or used defined Ec2 instance types. Nested virtualization is a supported feature in AWS, but these instances are quite more expensive than others.

The goal of this project is to deploy a lab environment as fast as possible. Everything should be easy to deploy and destroy. This is why the `vars.yml` provides a way to define where your ContainerLab definition files are cloned from (external git repository) and what docker images you'd like to have available in your lab environment. By the time the CDK stack is deployed, your lab environment is ready to be deployed with `containerlab deploy -t ..`.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
