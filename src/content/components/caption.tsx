import React, { useEffect, useRef, useState } from "react";
import styles from "./caption.module.css";
import { toUpdateCueChange } from "../../background/exports";
import { getGlobalCues } from "../exports";
import { sortLangKeys } from "../../utils/subtitle";

export interface CaptionProps {
  videoSelector: string;
  cues: SubtitleCue[];
  langSort: string[];
}

export default function Caption(props: CaptionProps) {
  const { containerRef, fontSize } = useFontSize();
  const { currentCue } = useCaptionTextTrackCue(props, containerRef);
  return (
    <div className={styles["caption-container"]} ref={containerRef}>
      {currentCue && (
        <div className={styles["captions-text"]} style={{ fontSize: fontSize }}>
          {renderCue(currentCue)}
        </div>
      )}
    </div>
  );
  function renderCue(cue: SubtitleCue) {
    if (!cue.i18n) return <>{currentCue?.text}</>;
    const langKeys = sortLangKeys(Object.keys(cue.i18n), props.langSort);
    return (
      <>
        {langKeys.map((lang) => cue.i18n[lang]).join("\n")}
      </>
    );
  }
}

function useCaptionTextTrackCue(
  props: CaptionProps,
  containerRef: React.MutableRefObject<HTMLDivElement>,
) {
  const { videoSelector, cues } = props;
  const [currentCue, setCurrentCue] = useState<
    SubtitleCue | null | undefined
  >();
  useEffect(() => {
    const video = document.querySelector(props.videoSelector);
    if (!video) return;

    const handleTimeupdate = (event: Event) => {
      if (!containerRef.current) return;
      if (getGlobalCues().length === 0) return;

      const target = event.target as HTMLVideoElement;
      const currentTime = target.currentTime;
      const item = cues.find((item) =>
        currentTime >= item.start && currentTime <= item.end
      );
      toUpdateCueChange(item);
      setCurrentCue(item);
    };
    video.addEventListener("timeupdate", handleTimeupdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeupdate);
    };
  }, [videoSelector, cues, containerRef]);
  return { currentCue };
}

function useFontSize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width / 45, height / 25);
        setFontSize(size);
      }
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);
  return {
    containerRef,
    fontSize,
  };
}
