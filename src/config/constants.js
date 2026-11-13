export const APP_CONFIG = {
  TITLE: import.meta.env.VITE_APP_TITLE || 'BUG OF GRATITUDE',
  VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: '#0B1021',
  TOTAL_MISSIONS: 4,
};

export const UI_SCREENS = {
  INTRO: 'intro',
  LOADING: 'loading',
  GAME_SHELL: 'game_shell',
};

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
};

export const EVENTS = {
  APP_READY: 'app:ready',
  SCENE_CHANGED: 'scene:changed',
  SCREEN_CHANGE: 'ui:screen_change',
  GAME_START_REQUESTED: 'game:start_requested',
  GAME_PAUSE_TOGGLED: 'game:pause_toggled',
  GAME_RESTART_REQUESTED: 'game:restart_requested',
  GAME_EXIT_REQUESTED: 'game:exit_requested',
  SOUND_TOGGLED: 'settings:sound_toggled',
  NOTIFY: 'ui:notify',
  INTERACTION_TARGET_CHANGED: 'interaction:target_changed',
  INTERACTION_TRIGGERED: 'interaction:triggered',
  PLAYER_MOVED: 'player:moved',
  MOBILE_INPUT_CHANGED: 'input:mobile_changed',
  MOBILE_INTERACT_PRESSED: 'input:mobile_interact',
};
