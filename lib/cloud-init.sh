#!/bin/bash
sudo yum update -y
sudo yum install docker -y
sudo yum install git -y
sudo service docker start
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Docker Compose install
sudo curl -L "https://github.com/docker/compose/releases/download/{{DOCKER_COMPOSE_VERSION}}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Containerlab install
if [ "{{CONTAINERLAB_VERSION}}" = "latest" ]; then
    bash -c "$(curl -sL https://get.containerlab.dev)"
else
    bash -c "$(curl -sL https://get.containerlab.dev)" -- -v "{{CONTAINERLAB_VERSION}}"
fi

# Docker images pull
{{DOCKER_PULL_COMMANDS}}

# Git clone repo
git clone {{REPO_URL}}
cd {{REPO_DIR}}
