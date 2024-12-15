import { toUpdateCollectorSubtitles } from "../background/exports";
import { markVideoContainer, SubtitleSelectorMark } from "../utils/make-video";

interface CollectorSubtitleCue {
  start?: number;
  end?: number;
  text?: string;
}
class SubtitleCollector {
  private video: HTMLVideoElement;
  private likeCaptionSelector: string;
  private subtitles: SubtitleCue[];
  private activeCue: CollectorSubtitleCue | null;
  private removeListeners: (() => void)[];

  constructor(videoSelector = "video", likeCaptionSelector: string) {
    this.video = document.querySelector(videoSelector) as HTMLVideoElement;
    this.likeCaptionSelector = likeCaptionSelector;
  }

  public startCollecting() {
    this.subtitles = [];
    // 如果有 textTrack 直接返回 textTrack
    if (this.video.textTracks.length) {
      this.collectWithTextTrack();
      return;
    }
    const timeupdate = () => {
      this.checkSubtitleContainer();
    };
    this.video.addEventListener(
      "timeupdate",
      timeupdate,
    );
    this.removeListeners = [() => {
      this.video.removeEventListener("timeupdate", timeupdate);
    }];
  }

  public stopCollecting() {
    this.removeListeners.forEach((remove) => remove());
  }

  private collectWithTextTrack() {
    const textTracks = this.video.textTracks;
    if (!textTracks.length) return;
    let activeTrack = [...textTracks].find((track) => track.mode == "showing");
    if (!activeTrack) {
      activeTrack = textTracks[0];
    }
    if (!activeTrack) return;
    const cues = activeTrack.cues;
    if (!cues.length) return;
    if (cues[0] instanceof VTTCue) {
      this.subtitles = [...cues].map((cue) => {
        return {
          start: cue.startTime,
          end: cue.endTime,
          text: (cue as VTTCue).text,
        };
      });
      toUpdateCollectorSubtitles({
        url: location.href,
        subtitles: this.subtitles,
        from: "crawl",
      });
    }
  }

  private checkSubtitleContainer() {
    const captionsEls = document.querySelectorAll(
      this.likeCaptionSelector,
    );
    const subtitleContainer = [...captionsEls].reverse().find((item) => {
      return getComputedStyle(item).display !== "none";
    });
    if (!subtitleContainer) return;

    const subtitleText = getDomText(subtitleContainer);
    if (subtitleText.length && !this.activeCue) {
      this.activeCue = {
        start: this.video.currentTime,
        text: subtitleText,
      };
    }
    if (!this.activeCue) return;

    if (subtitleText.length && subtitleText !== this.activeCue.text) {
      this.addCue();
      this.activeCue = {
        start: this.video.currentTime,
        text: subtitleText,
      };
      return;
    }

    // 当前没有字幕显示，但有未存储的字幕
    if (!subtitleContainer || !subtitleContainer.textContent.trim().length) {
      this.addCue();
    }
  }

  private addCue() {
    this.activeCue.end = this.video.currentTime;
    if (this.canCollect()) {
      this.subtitles.push(this.activeCue as SubtitleCue);
      toUpdateCollectorSubtitles({
        subtitles: this.subtitles,
        url: location.href,
        from: "crawl",
      });
    }
  }

  public canCollect() {
    if (!this.activeCue || !this.activeCue.start || !this.activeCue.end) {
      return false;
    }
    if (this.activeCue.start > this.activeCue.end) return false;
    // 已存在
    const subtitle = this.subtitles.find((subtitle) => {
      return subtitle.text === this.activeCue?.text &&
        Math.abs(subtitle.start - this.activeCue?.start) < 1;
    });

    return !subtitle;
  }
}

function getDomText(dom: HTMLElement | Element) {
  //处理shadowRoot case
  if (dom.shadowRoot) {
    //排除掉style标签河script标签
    const childNodes = dom.shadowRoot.childNodes;
    let text = "";
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i] as HTMLElement;
      if (
        !["style", "script", "img", "svg"].includes(node.nodeName.toLowerCase())
      ) {
        text += node.innerText || node.textContent || "";
      }
    }
    return text.trim();
  }
  return (dom as HTMLElement).innerText || dom.textContent || "";
}

let collector: SubtitleCollector | null = null;
export function stopCollectingSubtitles() {
  collector?.stopCollecting();
}

export function startCollectingSubtitles(config: Config) {
  try {
    const videoSelector = config.videoSelector || "video";

    const isMarked = markVideoContainer(
      videoSelector,
      config.likeCaptionSelectors,
    );
    if (!isMarked) return;

    const video = document.querySelector(videoSelector) as HTMLVideoElement;
    const captionLength = document.querySelectorAll(
      `[${SubtitleSelectorMark}=true]`,
    ).length;
    if (!video || (!captionLength && !video.textTracks.length)) return;
    collector = new SubtitleCollector(
      videoSelector,
      `[${SubtitleSelectorMark}=true]`,
    );
    collector.startCollecting();
    handleUrlChange((src) => {
      collector.stopCollecting();
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function handleUrlChange(
  onChange: (url: string) => void,
) {
  let currentUrl = location.href;
  const observer = new MutationObserver((mutations) => {
    const newUrl = location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      onChange(newUrl);
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
}
