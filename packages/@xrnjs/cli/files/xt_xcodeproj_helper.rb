
require 'xcodeproj'

# 最好装一个 rubyMine 的工具方便调试



# 打开现有的 Xcode 项目
# project_path = '/Users/liyuan/Documents/repo/xt-app-ios/ios/xtapp.xcodeproj'
project_path = ARGV[0] # 工程路径
project_target = ARGV[1] # 是壳工程的target
# Debug
# Release
# Staging
project_config_name = ARGV[2] # 是壳工程的模式
project_buildSettings_key = ARGV[3] # 需要修改的 buildSettings 的key
project_buildSettings_value = ARGV[4] # 需要修改的 buildSettings 的value

project = Xcodeproj::Project.open(project_path)

# 修改构建设置的某个字段，例如修改 'PRODUCT_BUNDLE_IDENTIFIER'
# build_config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.new.bundle.identifier'

xtapp_target = project.targets.find { |target| target.name == project_target }

if xtapp_target
    puts "prepare change target: #{xtapp_target.name}"
    finish_change = false
    # 获取该目标的构建配置
    xtapp_target.build_configurations.each do |config|
      # 修改构建设置，例如修改 'PRODUCT_BUNDLE_IDENTIFIER'
      if config.name == project_config_name
        if config.build_settings.key?(project_buildSettings_key)
          config.build_settings[project_buildSettings_key] = project_buildSettings_value
          puts "#{xtapp_target}这个target的 #{project_buildSettings_key} 修改为 #{project_buildSettings_value}"
          finish_change = true
        else 
          raise StandardError.new("buildSetting中不存在 #{project_buildSettings_key} 不存在 ")
        end
      end      
    end
else
    raise StandardError.new("Target #{project_target} not found.")
end

if finish_change 
  # 保存项目文件
  project.save
else
  raise StandardError.new("#{xtapp_target}这个target的 #{project_buildSettings_key} 修改 #{project_buildSettings_value} 失败！！！")
end