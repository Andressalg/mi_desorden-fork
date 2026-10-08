Pod::Spec.new do |s|
  s.name           = 'Reconocer'
  s.version        = '1.0.0'
  s.summary        = 'Reconoce productos con Apple Vision: huella visual y texto de la etiqueta'
  s.author         = 'mi_desorden'
  s.homepage       = 'https://github.com/guzzo1309/mi_desorden'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/guzzo1309/mi_desorden.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision'

  s.source_files = '**/*.{h,m,swift}'
end
