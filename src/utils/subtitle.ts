import { detectLangByBrowser } from "../background/exports";

export async function formatSubtitles(subs: SubtitleCue[]) {
  if (subs.find((item) => item.i18n && Object.keys(item.i18n).length)) {
    return subs;
  }

  const mergedSubs = mergeDupSubs(subs);
  const i18nSubs = await splitI18nSubs(mergedSubs);
  return i18nSubs;
}

async function splitI18nSubs(subs: SubtitleCue[]) {
  let autoText = "";
  for (let cue of subs) {
    const texts = cue.text?.split("\n") || [];
    const i18n: any = {};
    texts.forEach((text) => {
      const lang = detectLangByLocal(text);
      if (lang == "auto") autoText += " " + text;

      const array = i18n[lang] || [];
      array.push(text);
      i18n[lang] = array;
    });
    Object.keys(i18n).forEach((lang) => {
      i18n[lang] = i18n[lang].join("\n");
    });
    cue.i18n = i18n;
  }
  const lang = await detectLangByBrowser(autoText, "en") || "en";

  for (let cue of subs) {
    if (!cue.i18n || !cue.i18n["auto"]) continue;
    cue.i18n[lang] = cue.i18n["auto"];
    delete cue.i18n["auto"];
  }
  return subs;
}

function mergeDupSubs(subs: SubtitleCue[]) {
  const newSubs: SubtitleCue[] = [];
  let lastCue: SubtitleCue | undefined;
  for (let cue of subs) {
    if (lastCue?.start == cue.start && lastCue?.end == cue.end) {
      lastCue.text += "\n" + cue.text;
      lastCue = cue;
      continue;
    }
    newSubs.push(cue);
    lastCue = cue;
  }
  return newSubs.map((cue) => {
    return {
      start: cue.start > 1000 ? cue.start / 1000 : cue.start,
      end: cue.end > 1000 ? cue.end / 1000 : cue.end,
      text: cue.text,
    };
  });
}

export function detectLangByLocal(text: string) {
  // 匹配中文简体的正则表达式
  const chineseSimplifiedRegex = /[\u4E00-\u9FFF]+/;
  // 匹配中文繁体的正则表达式
  const chineseTraditionalRegex = /[\u4E00-\u9FA5]+/;

  if (chineseSimplifiedRegex.test(text)) {
    return "zh-CN";
  } else if (chineseTraditionalRegex.test(text)) {
    return "zh-TW";
  } else {
    return "auto";
  }
}

export function sortLangKeys(keys: string[], langSort?: string[]) {
  return keys.sort((a: string, b: string) => {
    if (!langSort) return -1;
    return langSort.indexOf(a) - langSort.indexOf(b);
  });
}