// Web ve test ortamı için boş reklam bileşenleri (reklam SDK'sı yalnızca mobilde çalışır).
export function AdsBootstrap() {
  return null;
}
export function AdBanner() {
  return null;
}
export function maybeShowInterstitial() {}
export async function showPrivacyOptions() {
  return false;
}
export function usePrivacyOptionsRequired() {
  return false;
}
