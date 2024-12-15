import { injectCss } from "../utils/inject-css";
import {
  markVideoContainer,
  SubtitleSelectorMark,
  VideoSelectorMark,
} from "../utils/make-video";
import { renderComp } from "./components";

let globalVideoSelector = "video";
let captionEle: HTMLElement | null = null;
export async function attachExternalSubtitle(
  config: Config,
  cues?: SubtitleCue[],
) {
  if (!cues) return false;

  const videoSelector = config.videoSelector || "video";
  const captionWrapperSelector = config.captionWrapperSelector;
  const videoContainerSelector = config.videoContainerSelector ||
    `[${VideoSelectorMark}=true]`;

  const isMarked = markVideoContainer(
    videoSelector,
    config.likeCaptionSelectors,
  );
  if (!isMarked) return;

  injectCss({
    id: "extsub-inject-style",
    css: `
      ${[captionWrapperSelector, `[${SubtitleSelectorMark}=true]`].join(",")} {
        display: none;
      }
    `,
    doc: document,
  });

  globalVideoSelector = `${videoContainerSelector} ${videoSelector}`;
  captionEle = renderComp({
    selector: videoContainerSelector,
    type: "appendChild",
    useShadowRoot: true,
    compName: "Caption",
    style: "",
    props: {
      cues,
      videoSelector: globalVideoSelector,
      langSort: config.langSort,
    },
  }) as HTMLElement;
  return true;
}

export function disableExternalSubtitle() {
  const style = document.getElementById("extsub-inject-style");
  if (style) {
    style.remove();
  }
  captionEle?.remove();
  return true;
}

export function updateVideoTime(time: number) {
  const video = document.querySelector(globalVideoSelector) as HTMLVideoElement;
  if (video) {
    video.currentTime = time;
  }
}
