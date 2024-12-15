import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import zhCN from "./zh-CN.json";
import zhTW from "./zh-TW.json";

export const i18nResources = {
  en: { translation: en },
  zh: { translation: zhCN },
  "zh-TW": { translation: zhTW },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    detection: {
      order: [
        "querystring",
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
    },
    resources: i18nResources,
    fallbackLng: "zh-CN",
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });
