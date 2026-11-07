// Android TV / Google TV desteği:
// - Uygulama TV ana ekranında (leanback) görünür, TV afişi eklenir
// - Dokunmatik ekran, GPS ve pusula zorunlu değil; böylece Play TV cihazlarını elemez
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const OPTIONAL_FEATURES = [
  'android.software.leanback',
  'android.hardware.touchscreen',
  'android.hardware.faketouch',
  'android.hardware.location',
  'android.hardware.location.gps',
  'android.hardware.location.network',
  'android.hardware.sensor.compass',
  'android.hardware.sensor.accelerometer',
];

function withTvManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-feature'] = manifest['uses-feature'] ?? [];
    for (const name of OPTIONAL_FEATURES) {
      const existing = manifest['uses-feature'].find((f) => f.$['android:name'] === name);
      if (existing) existing.$['android:required'] = 'false';
      else manifest['uses-feature'].push({ $: { 'android:name': name, 'android:required': 'false' } });
    }
    const app = manifest.application[0];
    app.$['android:banner'] = '@drawable/tv_banner';
    for (const act of app.activity ?? []) {
      for (const f of act['intent-filter'] ?? []) {
        const isMain = (f.action ?? []).some((a) => a.$['android:name'] === 'android.intent.action.MAIN');
        const isLauncher = (f.category ?? []).some((c) => c.$['android:name'] === 'android.intent.category.LAUNCHER');
        if (isMain && isLauncher && !(f.category ?? []).some((c) => c.$['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER')) {
          f.category.push({ $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } });
        }
      }
    }
    return cfg;
  });
}

function withTvBanner(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'assets', 'images', 'tv-banner.png');
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable-xhdpi');
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, path.join(dir, 'tv_banner.png'));
      return cfg;
    },
  ]);
}

module.exports = (config) => withTvBanner(withTvManifest(config));
