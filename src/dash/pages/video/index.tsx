import React, { useEffect } from "react";
import { AudioData } from "./components/AudioManager";
import VideoJS from "./components/videojs";
import { useTranscriber } from "./hooks/useTranscriber";
import { useCallback, useMemo, useState } from "react";
import { useConfig } from "../../../common/hooks";
import { openCrawlSubInPanel } from "../../../content/exports";
import { VideoManager } from "./components/VideoManager";
import AudioPlayer from "./components/AudioPlayer";
import { Spin } from "antd";

function App() {
  const [config] = useConfig();
  useEffect(() => {
    if (!config) return;
    openCrawlSubInPanel(true);
  }, [config]);
  const transcriber = useTranscriber();
  const [videoOption, setVideoOption] = useState<any>({
    autoplay: false,
    controls: true,
  });
  const [audioOption, setAudioOption] = useState<
    { url: string; mimeType: string }
  >(null);
  const onAudioDataChange = useCallback((audioData: AudioData) => {
    transcriber.start(audioData.buffer);
    if (audioData.mimeType === "audio/mp3") {
      setAudioOption({
        url: audioData.url,
        mimeType: audioData.mimeType,
      });
      return;
    }
    setVideoOption({
      autoplay: false,
      controls: true,
      width: 600,
      sources: audioData.url,
    });
  }, [setVideoOption]);
  const loadingTip = useMemo(() => {
    const item = transcriber.progressItems?.reverse()[0];
    if (!item) return;
    return item.name + " " + (item.progress?.toFixed(2) || "") + "%";
  }, [transcriber]);
  return (
    <Spin
      spinning={transcriber.progressItems.length > 0}
      tip={loadingTip}
    >
      <div className="flex mt-10 flex-col items-center justify-center">
        {videoOption.sources && (
          <VideoJS
            captionChunks={transcriber.output?.chunks}
            options={videoOption}
          />
        )}
        {audioOption && (
          <AudioPlayer
            audioUrl={audioOption.url}
            mimeType={audioOption.mimeType}
          />
        )}
        <VideoManager
          transcriber={transcriber}
          onAudioData={onAudioDataChange}
        />
      </div>
    </Spin>
  );
}

export default () => {
  if (location.href.includes(process.env.DASH_URL)) {
    return <App />;
  }
  return (
    <>
      <iframe
        src={`${process.env.DASH_URL}dash.html#video?pure-page=1`}
        style={{ width: "100%", height: "100%" }}
      />
    </>
  );
};
