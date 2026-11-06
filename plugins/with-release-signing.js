// Sürüm derlemesini yükleme anahtarıyla imzalar (Google Play için).
// Anahtar bilgileri Gradle özelliklerinden okunur; verilmezse hata ayıklama anahtarı kullanılır,
// böylece yerel derlemeler anahtarsız da çalışır.
//   -PuploadStoreFile=... -PuploadStorePassword=... -PuploadKeyAlias=... -PuploadKeyPassword=...
const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes('uploadStoreFile')) return cfg;
    g = g.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        release {
            if (project.hasProperty('uploadStoreFile')) {
                storeFile file(project.property('uploadStoreFile'))
                storePassword project.property('uploadStorePassword')
                keyAlias project.property('uploadKeyAlias')
                keyPassword project.property('uploadKeyPassword')
                storeType 'pkcs12'
            }
        }`,
    );
    // release derleme türünde imzayı seç
    g = g.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('uploadStoreFile') ? signingConfigs.release : signingConfigs.debug`,
    );
    cfg.modResults.contents = g;
    return cfg;
  });
};
