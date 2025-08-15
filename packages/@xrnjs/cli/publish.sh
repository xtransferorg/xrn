#!/bin/bash
source /etc/profile
#运维透传变量是否为生产
is_prod=$1
nvm install 18
nvm use 18
npm install yarn -g --registry=https://registry.npmmirror.com
yarn

if [ "$is_prod" == "false" ]; then
    yarn publish --tag beta
else
    yarn publish
fi
