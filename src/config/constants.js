export const APP_CONFIG = {
  TITLE: import.meta.env.VITE_APP_TITLE || 'BUG OF GRATITUDE',
  VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: '#0b0f19',
};

export const EVENTS = {
  APP_READY: 'app:ready',
  SCENE_CHANGED: 'scene:changed',
};

