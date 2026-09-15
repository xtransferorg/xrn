createBundleHash() {
    if [ -z $1 ]; then
        echo "[ERROR] Necessary parameter missing. baseDir: $1"
        return 
    fi

    if [ -z $bundleHashFile ]; then
        echo "[ERROR] Necessary parameter bundleHashFile missing. Run init diff repo first."
        exit -1
    fi

    echo "[INFO] Scanning folder: $1$2"
    for file in $(ls $1$2); do
        fullPath=$1$2/$file
        relPath=${fullPath//$code_push_dir/}
        if [ -f $fullPath ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                hash=$(cat $fullPath | md5)
            else
                hash=$(cat $fullPath | md5sum | awk -F ' ' '{print$1}')
            fi
            echo " $relPath $hash" >> $bundleHashFile
        fi
    done
    for file in $(ls $1/$2); do
        fullPath=$1$2/$file
        if [ -d $fullPath ]; then
            createBundleHash $1 $2/$file
        fi
    done
}


diffBundleHash() {
    if [ -z $1 ]; then
        echo "[ERROR] Necessary parameter missing. baseDir: $1"
        exit -1 
    fi

    if [ -z $bundleHashFile ]; then
        echo "[ERROR] Necessary parameter bundleHashFile missing. Run init diff repo first."
        exit -1
    fi

    timestamp=$(echo `date "+%Y%m%d%H%M%S"`)

    echo "[INFO] Scanning folder: $1$2"
    for file in $(ls $1$2); do
        fullPath=$1$2/$file
        relPath=${fullPath//$code_push_dir/}
        echo "[INFO] Processing $file, baseDir: $1, path: $2, relPath: $relPath"
        if [ -f $fullPath ]; then
            hash=$(cat $fullPath | md5sum | awk -F ' ' '{print$1}')
            echo " $relPath $hash " >> $currentHashFile
            baseHash=$(cat $bundleHashFile | grep " $harmonyAssets$relPath " | awk -F ' ' '{print$2}')

            # js bundle 文件不进行处理
            # 正则匹配 Android 和 iOS bundle名称
            if [[ $file == *".bundle" ]] || [[ $file == *".jsbundle" ]]; then
                echo "[INFO] 增量更新不处理---$file"
                continue
            fi

            if [ -z $baseHash ]; then
                echo "[INFO] New file"
                continue
            fi

            if [[ $hash == $baseHash ]]; then
                echo "[INFO] No change, removing..."
                rm -f $fullPath
            else
                echo "[INFO] Diff found."
                # 😭坑比，sed -i 后必须加个 "", 否则sed -i 命令执行错误, 起码在自己电脑zsh环境下语法错误
                # 但是 现行的打包机 不加 ""，是好的，估计是不同shell环境，语法校验可能没那么严格！
                # 此外，node.js 调用shell脚本后  不会产生shell脚本中的日志，这一点要赶紧调研加上，否则太难调试了。

                # codepush 是linux环境 所以sed -i 不需要加 "" ，否则语法错误 
                # sed -i 's/'$baseHash'/'$timestamp'/g' $bundleHashFile
                if [[ "$OSTYPE" == "darwin"* ]]; then
                  sed -i '' 's/'$baseHash'/'$timestamp'/g' $bundleHashFile
                #   sed -i.bak "s#${baseHash}#${timestamp}#g" "$bundleHashFile" && rm -f "${bundleHashFile}.bak"
                else
                  sed -i 's/'$baseHash'/'$timestamp'/g' $bundleHashFile
                fi
                # sed -i.bak "s#${baseHash}#${timestamp}#g" "$bundleHashFile" && rm -f "${bundleHashFile}.bak"

            fi
        fi
    done

    for file in $(ls $1$2); do
        fullPath=$1$2/$file
        if [ -d $fullPath ]; then
            diffBundleHash $1 $2/$file
        fi
    done

    if [ "`ls -A $1$2`" == "" ]; then
        echo "[INFO] Remove empty folder $1$2"
        rm -rf $1$2
    fi
}