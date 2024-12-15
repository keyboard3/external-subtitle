import { SITE_CONFIG, StorageKey } from "./const";
import defaultConfigList from "../assets/default.config.json";
import { arrayOrGenericToArray } from "../utils";
const defaultConfigs = defaultConfigList as Config[];

export default async function getConfig() {
  const configs: Config[] = await getLocalConfigs() || defaultConfigs;
  return matchConfig(configs, location.href);
}

export async function matchConfig(configs: Partial<Config>[], href: string) {
  const finalConfig = configs[0];
  for (let i = 1; i < configs.length; i++) {
    const config = configs[i];
    const matchList = Array.isArray(config.match)
      ? config.match
      : [config.match];
    for (let match of matchList) {
      if (new RegExp(match).test(href)) {
        mergeConfig(finalConfig, config);
        break;
      }
    }
  }
  return finalConfig as Config;
}

export async function getLocalConfigs() {
  const globalConfig = await getGlobalConfig();
  return globalConfig?.configs;
}

export async function getGlobalConfig() {
  const globalConfig = await browser.storage.local.get([
    StorageKey.storageConfig,
  ])
    .then((res) => res[StorageKey.storageConfig]) as GlobalConfig;
  return globalConfig;
}

export function setLocalConfigs(configs: Config[]) {
  const globalConfig: GlobalConfig = {
    localSyncTime: Date.now(),
    configs,
  };
  return browser.storage.local.set({
    [StorageKey.storageConfig]: globalConfig,
  });
}

export async function syncConfigs() {
  try {
    const res = await fetch(SITE_CONFIG);
    const configs = await res.json();
    if (configs.length) {
      await setLocalConfigs(configs);
    }
  } catch (err) {
    console.error(err);
  }
}

export function mergeConfig(
  original: Partial<Config>,
  additional: Partial<Config>,
) {
  const resultConfig = original as any;
  mergeRule({
    rule: additional,
    valueIsArray: (key) => Array.isArray(resultConfig[key]),
    getDiffValue: (key) => resultConfig[key],
    onMergedValue: (key, value) => resultConfig[key] = value,
  });
  return resultConfig;
}

function mergeRule({ rule, valueIsArray, getDiffValue, onMergedValue }: {
  rule: any;
  valueIsArray: (value: any) => boolean;
  getDiffValue: (key: string) => any;
  onMergedValue: (key: string, value: any) => void;
}) {
  Object.keys(rule).forEach((ruleKeyName: string) => {
    const [ruleKey, action, version] = parseRuleName(ruleKeyName);

    if (!ruleKey || rule[ruleKeyName] === undefined) return;
    let userValue = rule[ruleKeyName];
    if (valueIsArray(ruleKey)) {
      userValue = arrayOrGenericToArray(userValue);
    }
    const mergedValue = getDiffValue(ruleKey);
    if (mergedValue == undefined) {
      onMergedValue(ruleKey, userValue);
      return;
    }

    let result;
    if (action == "add") {
      if (!isPatch(version)) return;
      result = addAction(mergedValue, userValue);
    } else if (action == "remove") {
      if (!isPatch(version)) return;
      result = removeAction(mergedValue, userValue);
    }

    if (result) {
      onMergedValue(ruleKey, result);
      return;
    }
    onMergedValue(ruleKey, userValue);
  });
}

export function addAction(
  original: Array<string> | Object,
  additional: Array<string> | Object,
) {
  let result: any;
  if (Array.isArray(original)) {
    const additionalValue = arrayOrGenericToArray(additional);
    result = [...original, ...additionalValue];
    result = Array.from(new Set(result));
  } else if (typeof original == "object" && typeof additional == "object") {
    result = { ...original, ...additional };
  } else {
    result = additional;
  }
  return result;
}

export function removeAction(
  original: Array<string> | Object,
  additional: Array<string> | Object,
) {
  if (Array.isArray(original)) {
    const additionalValue = arrayOrGenericToArray(additional);
    original = original.filter(
      (item: any) => {
        return !additionalValue.includes(item);
      },
    );
    // @ts-ignore: ignore type error
    return Array.from(new Set(original));
  } else if (typeof original == "object" && typeof additional == "object") {
    Object.keys(additional).forEach((key) => {
      // @ts-ignore: ignore type error
      delete original[key];
    });
  } else {
    return additional;
  }
  return original;
}

function parseRuleName(ruleKeyName: string) {
  const index = ruleKeyName.lastIndexOf("[");
  let version = "";
  let resetKeyName = ruleKeyName;
  if (index > 0) {
    version = ruleKeyName.slice(index + 1, ruleKeyName.length - 1);
    resetKeyName = ruleKeyName.slice(0, index - 1);
  }
  return [...resetKeyName.split("."), version];
}

export function isPatch(
  version: string,
) {
  const pluginVersion = process.env.VERSION;
  return version && compareVersions(pluginVersion, version);
}

export function compareVersions(version1: string, version2: string) {
  const version = version1.split(".").reverse();
  const spVersion = version2.split(".").reverse();

  let spVNumber = 0, vNumber = 0;

  let moreV = 1;
  for (let i = 0; i < 3; i++) {
    spVNumber += moreV * Number(spVersion[i] || "0");
    vNumber += moreV * Number(version[i] || "0");
    moreV *= 100;
  }
  return vNumber >= spVNumber;
}
