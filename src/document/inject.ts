import {
  getConfig,
  setDocumentDomIsReady,
  toBackUpdateCollectorSubtitles,
} from "../content/exports";
import {
  matchRegexList,
  parseSubtitlesByArrayKeys,
  parseValue,
} from "../utils";
import { formatEventsToSubtitles } from "../utils/youtube";
import { listenXhrRes } from "./hooks";

console.log("inject script running...");

async function main() {
  setDocumentDomIsReady();
  const config = await getConfig();
  let subConfig: any;
  if (config.subtitleHook) {
    const hook = config.subtitleHook;
    subConfig = {
      filter: (url: string) => !!matchRegexList([hook.subRegex], url),
      onResponse: async (res: any, url: string) => {
        let originSubs: any;
        if (hook.itemPath) originSubs = parseValue(res, hook.itemPath);
        else originSubs = parseSubtitlesByArrayKeys(res, hook);

        if (!originSubs) {
          console.warn("hook not found subtitles", hook);
          return;
        }
        const timeDivisor = hook.timeDivisor || 1;
        const subtitles: SubtitleCue[] = originSubs.map((item: any) => {
          return {
            start: item[hook.startKey] / timeDivisor,
            end: item[hook.endKey] / timeDivisor,
            text: item[hook.textKey],
          };
        });
        toBackUpdateCollectorSubtitles({
          url: location.href,
          subtitles,
          from: "req_common",
        });
      },
    };
  }
  listenXhrRes([
    {
      filter: (url: string) => {
        return /api\/timedtext/.test(url);
      },
      onResponse: async (ytRes: YoutubeRes, url: string) => {
        const config = await getConfig();
        const lang = getTargetLang(url);
        let subtitles = formatEventsToSubtitles(
          ytRes.events || [],
          lang,
          config.ytAsrConfig,
        );

        subtitles = overrideTimeCues(subtitles);
        console.log("subtitles", subtitles);
        toBackUpdateCollectorSubtitles({
          url: location.href,
          subtitles,
          from: "req_yt",
        });
      },
    },
    subConfig,
  ].filter((item) => !!item));

  console.log("check injet from content context", await getConfig());
}
main();

function getTargetLang(url: string) {
  const uri = new URL(url);
  const tlang = uri.searchParams.get("tlang");
  const lang = uri.searchParams.get("lang");
  return tlang || lang;
}

function overrideTimeCues(cues: SubtitleCue[]) {
  for (let i = cues.length - 2; i >= 0; i--) {
    if (cues[i + 1].start < cues[i].end) {
      cues[i].end = cues[i + 1].start;
    }
  }
  return cues.filter((cue) => !!cue.text?.trim())
    .map((item) => ({
      start: item.start / 1000,
      end: item.end / 1000,
      text: item.text,
    }));
}