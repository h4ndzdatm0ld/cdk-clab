#!/bin/bash
sudo yum update -y
sudo yum install -y git docker
sudo service docker start
sudo usermod -a -G docker ec2-user
sudo chkconfig docker on
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
sudo yum install -y bridge-utils traceroute
git clone {{REPO_URL}} {{REPO_DIR}}
{{DOCKER_PULL_COMMANDS}}
