import { useEffect, useRef } from "react";
import { TranscriberData } from "../hooks/useTranscriber";
import React from "react";
import {
  attachSubtitle,
  toBackUpdateCollectorSubtitles,
} from "../../../../content/exports";
import debounce from "lodash.debounce";

const VideoJS = (props: {
  captionChunks?: TranscriberData["chunks"];
  options: VideoJsNS.PlayerOptions;
  onReady?: (player: VideoJsNS.Player) => void;
}) => {
  const { options, onReady, captionChunks } = props;
  useCaptions(captionChunks);
  return (
    <div style={{ position: "relative" }}>
      <video
        src={options.sources as any}
        controls
        style={{ width: options.width }}
      />
    </div>
  );
};

const debounceUpdateCollectorSubtitles = debounce(
  toBackUpdateCollectorSubtitles,
  200,
);
const debounceAttachSubtitle = debounce(attachSubtitle, 200);

function useCaptions(
  captionChunks?: TranscriberData["chunks"],
) {
  useEffect(() => {
    if (!captionChunks?.length) return;
    const subtitles = captionChunks.map(
      (chunk: TranscriberData["chunks"][0], i: number) => {
        const start = chunk.timestamp[0];
        const end = chunk.timestamp?.[1] || chunk.timestamp[0] + 1;
        const text = chunk.text.trim();
        return {
          start,
          end,
          text,
        };
      },
    );
    debounceUpdateCollectorSubtitles({
      url: location.href,
      subtitles,
      from: "crawl",
    });
    debounceAttachSubtitle(subtitles);
  }, [captionChunks]);
}

export default VideoJS;

declare global {
  interface Window {
    videojs: (
      ele: HTMLElement | string,
      options?: VideoJsNS.PlayerOptions,
      ready?: () => void,
    ) => VideoJsNS.Player;
  }
}
