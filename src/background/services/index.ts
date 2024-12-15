import {
  rateOption as googleRateOption,
  translateListByGoogle,
} from "./google";
import { rateOption as bingOption, translateListByBing } from "./bing";

export const translateServicesConfigs = {
  "google": {
    serviceKey: "google",
    translateList: translateListByGoogle,
    rateOption: googleRateOption,
  },
  "bing": {
    "serviceKey": "bing",
    translateList: translateListByBing,
    rateOption: bingOption,
  },
} as {
  [key in TranslateService]: TranslationServiceConfig;
};
