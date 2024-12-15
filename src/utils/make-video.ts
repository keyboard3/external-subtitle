import querySelectorsAll from "./dom";

export const VideoSelectorMark = "extsub-video-container";
export const SubtitleSelectorMark = "extsub-subtitle-container";
export function markVideoContainer(
  videoSelector: string,
  likeCaptionSelectors: string[],
): boolean {
  const videoElement = findMaxVideo(videoSelector);
  if (!videoElement) return false;

  let currentElement: HTMLElement = videoElement;
  let depth = 0; // 用于跟踪遍历的层数

  let lastSamePositionElement: HTMLElement | null = null;

  // 循环向上遍历，但不超过5级
  while (depth < 10 && currentElement.parentElement) {
    // 移动到下一级父元素并增加深度计数
    currentElement = currentElement.parentElement;
    depth++;
    if (currentElement === document.body) {
      // 如果遍历到了document.body，则停止
      break;
    }

    if (checkPosition(currentElement)) {
      // 如果容器与播放器的宽高相差过大，则不认为是播放器父级容器
      if (!compareRect(currentElement, videoElement)) continue;
      lastSamePositionElement = currentElement;

      // 如果当前元素的position为relative，尝试在它的子元素中查找包含'caption'的类名的元素
      const captionElements = querySelectorsAll(
        currentElement,
        likeCaptionSelectors,
      );
      if (!captionElements.length) continue;
      captionElements.forEach((captionElement) => {
        if (!captionElement.contains(videoElement)) {
          captionElement?.setAttribute(SubtitleSelectorMark, "true");
        }
      });

      captionElements.forEach((captionElement) => {
        if (captionElement.parentElement.closest(`[${SubtitleSelectorMark}]`)) {
          captionElement.removeAttribute(SubtitleSelectorMark);
        }
      });
      const list = [...document.querySelectorAll(`[${SubtitleSelectorMark}]`)];
      list.slice(0, list.length - 1).forEach((ele) => {
        ele.removeAttribute(SubtitleSelectorMark);
      });

      if (mark(videoElement, currentElement)) {
        return true;
      }
    }
  }

  if (
    lastSamePositionElement &&
    mark(videoElement, lastSamePositionElement)
  ) {
    return true;
  }

  return false;
}

function findMaxVideo(videoSelector: string) {
  const videos = document.querySelectorAll(videoSelector);
  let maxVideo: HTMLVideoElement | null = null;
  let maxArea = 0;
  videos.forEach((video) => {
    const area = video.clientWidth * video.clientHeight;
    if (area > maxArea) {
      maxArea = area;
      maxVideo = video as HTMLVideoElement;
    }
  });
  return maxVideo;
}

function mark(
  videoEle: HTMLElement | Element,
  currentEle: HTMLElement | Element,
) {
  // 比较宽度和高度
  if (compareRect(currentEle, videoEle)) {
    currentEle?.setAttribute(VideoSelectorMark, "true");
    return true;
  }
}

function compareRect(
  element: HTMLElement | Element,
  video: HTMLElement | Element,
) {
  const containerRect = element.getBoundingClientRect();
  const videoRect = video.getBoundingClientRect();
  const diffSmall = Math.abs(containerRect.width - videoRect.width) < 10 &&
    Math.abs(containerRect.height - videoRect.height) < 10;
  const sizeSmall = containerRect.width < videoRect.width &&
    containerRect.height < videoRect.height;
  return diffSmall || sizeSmall;
}

function checkPosition(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return style.position === "relative" || style.position === "absolute";
}
