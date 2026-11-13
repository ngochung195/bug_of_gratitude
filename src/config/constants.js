export const APP_CONFIG = {
  TITLE: import.meta.env?.VITE_APP_TITLE || 'BUG OF GRATITUDE',
  VERSION: import.meta.env?.VITE_APP_VERSION || '0.1.0',
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: '#0B1021',
  TOTAL_MISSIONS: 4,
  MAX_WRONG_ATTEMPTS: 3,
  GRATITUDE_MAX_LENGTH: 300,
  STORAGE_KEY: 'bog_mission_progress_v1',
  GRATITUDE_STORAGE_KEY: 'bog_gratitude_letters_v1',
  GRATITUDE_DRAFT_KEY: 'bog_gratitude_draft_v1',
};

export const UI_SCREENS = {
  INTRO: 'intro',
  LOADING: 'loading',
  GAME_SHELL: 'game_shell',
  LAST_BUG: 'last_bug',
  GRATITUDE_LETTER: 'gratitude_letter',
  RAIN_OF_GRATITUDE: 'rain_of_gratitude',
};

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
};

export const MISSION_STATUS = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
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
  MISSION_OPEN_REQUESTED: 'mission:open_requested',
  MISSION_MODAL_TOGGLED: 'mission:modal_toggled',
  MISSION_UPDATED: 'mission:updated',
  MISSION_COMPLETED: 'mission:completed',
  MISSION_FAILED_ATTEMPT: 'mission:failed_attempt',
  MISSION_OUT_OF_ATTEMPTS: 'mission:out_of_attempts',
  MISSION_PROGRESS_RESET: 'mission:progress_reset',
  ALL_MISSIONS_COMPLETED: 'ALL_MISSIONS_COMPLETED',
  LAST_BUG_TRIGGERED: 'last_bug:triggered',
  FIX_LAST_BUG_REQUESTED: 'last_bug:fix_requested',
  GRATITUDE_SUBMITTED: 'gratitude:submitted',
};
