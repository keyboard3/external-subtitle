import {
  attachSubtitle,
  collectingSubtitles,
  disableSubtitle,
  stopCollecting,
  updateCaption,
  updateVideoPlayTime,
} from "../content/exports";
import { updateCollectorSubtitles, updateCueChange } from "../panel/exports";
import { translateServicesConfigs } from "./services";

export async function fetchInBackground(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) {
  return fetch(input, init).then(async (res) => {
    const { status, statusText, headers } = res;

    const headersObj: any = {};
    for (let [key, value] of headers.entries()) {
      headersObj[key] = value;
    }
    let result = await res.arrayBuffer() as ArrayBuffer;
    const arrayBuffer = Array.from(new Uint8Array(result));
    const response = {
      arrayBuffer,
      options: {
        status,
        statusText,
        headers: headersObj,
      },
    };
    return JSON.stringify(response);
  });
}

export async function openTab(url: string) {
  browser.tabs.create({ url });
}

export async function saveSubtitles(url: string, data: SubtitlesData) {
  browser.storage.local.set({ [url]: data });
}

export async function getCacheSubtitles(url: string): Promise<SubtitlesData> {
  return browser.storage.local.get([url]).then((res) => res[url]);
}

export async function toAttachSubtitle(subs: SubtitleCue[]): Promise<boolean> {
  return attachSubtitle(subs);
}

export async function toDisableSubtitle() {
  return disableSubtitle();
}

export async function toUpdateVideoCaption(index: number, sub: SubtitleCue) {
  updateCaption(index, sub);
}

export async function toUpdateVideoPlayTime(time: number) {
  updateVideoPlayTime(time);
}

export async function toUpdateCueChange(sub: SubtitleCue) {
  updateCueChange(sub);
}

export async function toCollectingSubtitles() {
  return collectingSubtitles();
}

export async function toStopCollecting() {
  return stopCollecting();
}

const sortCrawlKeys: SubtitlesData["from"][] = ["crawl", "req_nst", "req_yt"];
let cacheSubs: Map<string, SubtitlesData[]> = new Map();
export async function toUpdateCollectorSubtitles(data: SubtitlesData | null) {
  if (!data) return;
  const subDataList = (cacheSubs.get(data.url) || []) as SubtitlesData[];
  const findIndex = subDataList.findIndex((item) => item.from == data.from);
  if (findIndex >= 0) subDataList[findIndex] = data;
  else subDataList.push(data);
  subDataList.sort((a, b) => {
    return sortCrawlKeys.indexOf(a.from) - sortCrawlKeys.indexOf(b.from);
  });
  cacheSubs.set(data.url, subDataList);
  updateCollectorSubtitles(subDataList[0]);
}

export async function getReqCrawlSubtitles(
  url: string,
): Promise<SubtitleCue[]> {
  return cacheSubs.get(url)?.[0].subtitles || [];
}

export async function detectLangByBrowser(
  text: string,
  backLang: LanguageCode,
) {
  if (!browser?.i18n?.detectLanguage) return "auto";
  try {
    const results = await browser.i18n.detectLanguage(text);
    if (!results.languages.length) return "auto";
    if (results.isReliable) {
      return results.languages[0].language;
    }

    for (const lang of results.languages) {
      if (lang.language == backLang && lang.percentage > 60) {
        return backLang;
      }
    }
  } catch (e) {
    console.debug(`detect language error`, e);
    return "auto";
  }
}
