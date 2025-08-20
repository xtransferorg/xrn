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
    
  s.dependency 'JRSwizzle'
  s.dependency 'YYCache', '1.0.4'
  s.dependency 'React'

end
