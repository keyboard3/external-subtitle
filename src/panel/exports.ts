import { APP_NAME } from "../common/const";

export async function updateCollectorSubtitles(
  data: SubtitlesData,
) {
  document.dispatchEvent(
    new CustomEvent(APP_NAME + "updateCollectorSubtitles", {
      detail: data,
    }),
  );
}

let latestCue: SubtitleCue | undefined;
export async function updateCueChange(cue: SubtitleCue | undefined) {
  if (latestCue?.start == cue?.start) return;
  document.dispatchEvent(
    new CustomEvent(APP_NAME + "cueChange", { detail: cue }),
  );
  latestCue = cue;
}

export async function openCrawlSubInPanel(activeCrawlSub: boolean) {
  document.dispatchEvent(
    new CustomEvent(APP_NAME + "openPanel", {
      detail: {
        activeCrawlSub,
      },
    }),
  );
}

export async function openApplySubInPanel(
  subtitles: SubtitleCue[],
  activeApplySub: boolean,
) {
  document.dispatchEvent(
    new CustomEvent(APP_NAME + "openPanel", {
      detail: {
        subtitles,
        activeApplySub,
      },
    }),
  );
}

export async function dispatchUrlChange(url: string) {
  document.dispatchEvent(
    new CustomEvent(APP_NAME + "urlChange", {
      detail: url,
    }),
  );
}
