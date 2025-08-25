#!/bin/bash
is_prod=$1
export APP_NAME=$2

echo "is_prod: $is_prod"
echo "APP_NAME: $APP_NAME"

yarn publish:from-package

# 将逗号分隔的包名转换为空格分隔
# PACKAGES=${APP_NAME//,/ }

# nvm install v20.16.0 && nvm use v20.16.0 

# yarn install --no-immutable

# if [ $is_prod == "false" ]; then
#     echo "beta"
#     npx xrn-tools batch-publish $PACKAGES --beta
# else
#     echo "prod"
#     npx xrn-tools batch-publish $PACKAGES
# fi
