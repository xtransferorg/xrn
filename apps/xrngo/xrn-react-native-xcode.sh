# 解决iOS虚拟目录jsbundle映射问题，build阶段动态拷贝进入xx.app的产物目录
# set -x

XT_DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH
XT_PROJECT_ROOT="${SRCROOT%/*}"
XT_MAIN_BUNDLE_SOURCE="${XT_PROJECT_ROOT}/release_ios"
XT_COMMON_BUNDLE_SOURCE=$XT_MAIN_BUNDLE_SOURCE
XT_DIFF_PATCH_SOURCE="${XT_PROJECT_ROOT}/HDiffPatch"
XT_DIFF_PATCH_DEST="${XT_DEST}/HDiffPatch"

  # 在这里添加你要执行的命令
# 检查目录是否存在，并且是否包含 codepush.json 文件
if [[ -d "$XT_DIFF_PATCH_SOURCE" ]] && [[ -f "$XT_DIFF_PATCH_SOURCE/codepush.json" ]]; then
    echo "✅ 目录 '$XT_DIFF_PATCH_SOURCE' 存在，并且包含 'codepush.json' 文件。"

    # 如果目录不存在，则创建
    if [[ ! -d "$XT_DIFF_PATCH_DEST" ]]; then
        echo "📂 目录 '$XT_DIFF_PATCH_DEST' 不存在，正在创建..."
        mkdir "$XT_DIFF_PATCH_DEST" && echo "✅ 目录创建成功！" || { echo "❌ 目录创建失败！" >&2; exit 1; }
    else
        echo "✅ 目录 '$XT_DIFF_PATCH_DEST' 已存在，无需创建。"
    fi

    cp "$XT_DIFF_PATCH_SOURCE/codepush.json" $XT_DIFF_PATCH_DEST

fi

#common包和基线文件生成#
echo "🐸----$XRN_BUILD_TYPE"
if [ -n "$XRN_BUILD_TYPE" ] && [ "$XRN_BUILD_TYPE" = "debug" ]; then # jenkins打包注入的CI变量为true
    echo "jenkins build debug app"
    # 打包构建时，它会自动把manifest.json输出到这个目录 ios/release_ios/assets/manifest.json，打包cli直接处理了
elif [ -z "$XRN_BUILD_TYPE" ]; then
    echo "developer use Xcode run app"

    # pushd ..

    # FILE_PATH="commonBundleHash"
    # if [ ! -f "$FILE_PATH" ]; then
    #     touch "$FILE_PATH"
    #     echo "File $FILE_PATH created."
    # else
    #     echo "File $FILE_PATH already exists."
    # fi

    # FILE_CONTENT=$(cat $FILE_PATH)
    # echo "current commom bundle hash = $FILE_CONTENT"

    # popd

    # # 括号语法是起子shell，这样执行完了，也不影响当前shell执行目录
    # FILE_HASH=$(cd .. && md5 -q package.json)

    # if [ "$FILE_CONTENT" = "$FILE_HASH" ]; then
    #     echo "use common bundle cache"
    # else
    #     echo "not use common bundle cache"
    #     export NVM_DIR="$HOME/.nvm"
    #     [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # 解决找不到xt-rn-cli的问题
    #     eval "$(/opt/homebrew/bin/brew shellenv)" # 解决找不到 watchman 一直打包报错的问题 
    #     # 括号语法是起子shell，这样执行完了，也不影响当前shell执行目录
    #     #cd ..
    #     #echo "password" | sudo -S echo "哈哈"
    #     #echo "password" | sudo -S launchctl limit maxfiles 65536 65536 && ulimit -n 65536
    #     #echo "launchctl limit maxfiles"
    #     #launchctl limit maxfiles
    #     #echo "ulimit -n"
    #     #ulimit -n
    #     #xt-rn-cli bundle common --appVersion 0.0.0 --platform ios --output-meta-jsdfson "release_ios/assets/manifest.json"
    #     #cd ios
    #     (pwd && cd .. && xt-rn-cli bundle common --appVersion 0.0.0 --platform ios --output-meta-json "release_ios/assets/manifest.json")
    #     if [[ $? != 0 ]];then
    #         echo "xt-rn-cli exit 1"
    #         exit 1
    #     fi
    #     (cd .. && echo "$FILE_HASH" > "$FILE_PATH")
    #     pwd
    # fi
    # echo "developer use Xcode run app"
else
    ehco "jenkins build release app"
fi

#common包和基线文件生成#

if [[ -d "$XT_MAIN_BUNDLE_SOURCE/assets" ]] && find "$XT_MAIN_BUNDLE_SOURCE" -type f -name "*.jsbundle" | grep -q .; then
    echo "resources is ready in this directory $XT_MAIN_BUNDLE_SOURCE "
else
    echo "assets or jsbundle is not exist in  $XT_MAIN_BUNDLE_SOURCE directory" >&2 #输出到标准错误stderr
    exit 2
fi

XT_SUB_BUNDLE_SOURCE="${SRCROOT}/subBundles"
if find "$XT_SUB_BUNDLE_SOURCE" -type f -name "*.jsbundle" | grep -q .; then
    echo "resources is ready in this directory $XT_SUB_BUNDLE_SOURCE "
else
    echo "jsbundle is not exist in  $XT_SUB_BUNDLE_SOURCE directory" >&2 #输出到标准错误stderr
    exit 2
fi



# INFOPLIST_FILE\=xtapp/Info.plist
# TARGET_NAME\=xtapp
# MainBundleName
XT_PlistBuddy_CLI="/usr/libexec/PlistBuddy"
XT_INFO_PLIST_PATH="${SRCROOT}/${INFOPLIST_FILE}"
XT_SUB_BUNDLE_PLIST_PATH="${SRCROOT}/BundleEventCenter/bundleController/xtBundles.plist"

# XT_INFO_PLIST_PATH="/Users/liyuan/Documents/repo/xt-app-ios/ios/xtapp/Info.plist"
# XT_SUB_BUNDLE_PLIST_PATH="/Users/liyuan/Documents/repo/xt-app-ios/ios/BundleEventCenter/bundleController/xtBundles.plist"
# MAIN_BUNDLE_NAME=$("$XT_PlistBuddy_CLI" -c "Print :MainBundleName" "$XT_INFO_PLIST_PATH")

xt_check_bundle_existence_and_copy() {
    local xt_bundle_source="$1"
    local xt_bundle_name="$2"

    if find "$xt_bundle_source" -type f -name "$xt_bundle_name.jsbundle" | grep -q .; then
        echo "$xt_bundle_name.jsbundle is ready in this directory $xt_bundle_source"

        # 编译缓存，可能不用用是否有文件来判断
        # if [[ -f "$XT_DEST/$xt_bundle_name.jsbundle" ]]; then
        #     echo "error: $xt_bundle_name.jsbundle exist conflict" >&2 #输出到标准错误stderr
        #     exit 2
        # else
            cp "$xt_bundle_source/$xt_bundle_name.jsbundle" $XT_DEST
            echo "finish copy $xt_bundle_name.jsbundle to $XT_DEST"
        # fi

    else
        echo "$xt_bundle_name.jsbundle does not exist in $xt_bundle_source directory" >&2 # 输出到标准错误stderr
        exit 2
    fi
}

# 检查主bundle是否匹配
XT_MAIN_BUNDLE_NAME=$($XT_PlistBuddy_CLI -c "Print :MainBundleName" $XT_INFO_PLIST_PATH)
xt_check_bundle_existence_and_copy "$XT_MAIN_BUNDLE_SOURCE" "$XT_MAIN_BUNDLE_NAME"

XT_COMMON_BUNDLE_NAME=$($XT_PlistBuddy_CLI -c "Print :CommonBundleName" $XT_INFO_PLIST_PATH)
xt_check_bundle_existence_and_copy "$XT_COMMON_BUNDLE_SOURCE" "$XT_COMMON_BUNDLE_NAME"

# 检查子bundle是否匹配
xt_sub_bundle_array_keys=$($XT_PlistBuddy_CLI -c "Print :" $XT_SUB_BUNDLE_PLIST_PATH | grep -E "^\s+jsBundleName" | wc -l)
for ((i=0; i<$xt_sub_bundle_array_keys; i++))
do
    # 使用PlistBuddy获取jsBundleName值并打印
    xt_sub_bundle_name=$($XT_PlistBuddy_CLI -c "Print :$i:jsBundleName" $XT_SUB_BUNDLE_PLIST_PATH)
    xt_check_bundle_existence_and_copy "$XT_SUB_BUNDLE_SOURCE" "$xt_sub_bundle_name"
done
