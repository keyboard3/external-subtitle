declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROD: string;
      DASH_URL: string;
      VERSION: string;
      PLATFORM: "userscript" | "chrome" | "firefox";
    }
  }
}
export {};
