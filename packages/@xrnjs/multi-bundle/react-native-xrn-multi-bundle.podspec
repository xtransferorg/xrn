require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "react-native-xrn-multi-bundle"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platform    = :ios, '12.4'
  s.source       = { git: "https://github.com/xtransferorg/xrn" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.dependency 'JRSwizzle', '2.0.0'
  s.dependency 'YYCache', '1.0.4'
  
	if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
		install_modules_dependencies(s)
		hash = s.to_hash
		current_config = hash["pod_target_xcconfig"] || {}
		current_headers = current_config["HEADER_SEARCH_PATHS"] || ""
		current_config["HEADER_SEARCH_PATHS"] = "#{current_headers} \"$(PODS_ROOT)/Headers/Private/React-Core\""
		s.pod_target_xcconfig = current_config
	else
		s.dependency 'React-Core'
	end

end
