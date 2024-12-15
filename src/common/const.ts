export const APP_NAME = "external_subtitles";

export const StorageKey = {
  storageConfig: "storage_config",
  userConfig: "user_config",
  bingAuth: "bing_auth_token",
};

export const allTranslationServices = ["google", "bing"];

export const SITE_HOST = process.env.PROD == "1"
  ? "https://www.youtube.com/"
  : "http://localhost:9000/";

export const SITE_CONFIG = SITE_HOST + "default.config.json";
