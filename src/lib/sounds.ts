// Vakit bildirimi sesleri. Android'de bir bildirim kanalının sesi oluşturulduktan sonra
// değiştirilemediği için her ses ayrı bir kanalla çalınır.

export type SoundId =
  | 'varsayilan'
  | 'zil'
  | 'can'
  | 'kristal'
  | 'allah'
  | 'allah2'
  | 'besmele'
  | 'besmele2'
  | 'tekbir'
  | 'tekbir2'
  | 'sessiz';

export type SoundDef = { id: SoundId; file: string | null; asset?: number };

export const SOUNDS: SoundDef[] = [
  { id: 'varsayilan', file: null },
  { id: 'zil', file: 'zil.wav', asset: require('../../assets/sounds/zil.wav') },
  { id: 'can', file: 'can.wav', asset: require('../../assets/sounds/can.wav') },
  { id: 'kristal', file: 'kristal.wav', asset: require('../../assets/sounds/kristal.wav') },
  { id: 'allah', file: 'allah.mp3', asset: require('../../assets/sounds/allah.mp3') },
  { id: 'allah2', file: 'allah2.mp3', asset: require('../../assets/sounds/allah2.mp3') },
  { id: 'besmele', file: 'besmele.mp3', asset: require('../../assets/sounds/besmele.mp3') },
  { id: 'besmele2', file: 'besmele2.mp3', asset: require('../../assets/sounds/besmele2.mp3') },
  { id: 'tekbir', file: 'tekbir.mp3', asset: require('../../assets/sounds/tekbir.mp3') },
  { id: 'tekbir2', file: 'tekbir2.mp3', asset: require('../../assets/sounds/tekbir2.mp3') },
  { id: 'sessiz', file: null },
];

export const soundDef = (id: SoundId | undefined) => SOUNDS.find((s) => s.id === id) ?? SOUNDS[0];

/** Bildirim kanalı kimliği; ilk sürümdeki kanal varsayılan ses için korunur. */
export const channelFor = (id: SoundId | undefined) =>
  !id || id === 'varsayilan' ? 'namaz-vakitleri' : `vakit-ses-${id}`;
