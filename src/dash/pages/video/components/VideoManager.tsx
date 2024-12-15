import React, { useEffect, useState } from "react";
import axios from "axios";
import Constants from "../utils/Constants";
import { Transcriber } from "../hooks/useTranscriber";
import Dragger from "antd/es/upload/Dragger";
import VideoCameraOutlined from "@ant-design/icons/lib/icons/VideoCameraOutlined";

export enum AudioSource {
  URL = "URL",
  FILE = "FILE",
  RECORDING = "RECORDING",
}
export interface AudioData {
  buffer: AudioBuffer;
  url: string;
  source: AudioSource;
  mimeType: string;
}

export function VideoManager(
  props: { transcriber: Transcriber; onAudioData: (data: AudioData) => void },
) {
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [audioData, setAudioData] = useState<
    | {
      buffer: AudioBuffer;
      url: string;
      source: AudioSource;
      mimeType: string;
    }
    | undefined
  >(undefined);
  const [audioDownloadUrl, setAudioDownloadUrl] = useState<
    string | undefined
  >(undefined);

  const isAudioLoading = progress !== undefined;

  const setAudioFromDownload = async (
    data: ArrayBuffer,
    mimeType: string,
  ) => {
    const audioCTX = new AudioContext({
      sampleRate: Constants.SAMPLING_RATE,
    });
    const blobUrl = URL.createObjectURL(
      new Blob([data], { type: "audio/*" }),
    );
    const decoded = await audioCTX.decodeAudioData(data);
    setAudioData({
      buffer: decoded,
      url: blobUrl,
      source: AudioSource.URL,
      mimeType: mimeType,
    });
  };

  const downloadAudioFromUrl = async (
    requestAbortController: AbortController,
  ) => {
    if (audioDownloadUrl) {
      try {
        setAudioData(undefined);
        setProgress(0);
        const { data, headers } = (await axios.get(audioDownloadUrl, {
          signal: requestAbortController.signal,
          responseType: "arraybuffer",
          onDownloadProgress(progressEvent) {
            setProgress(progressEvent.progress || 0);
          },
        })) as {
          data: ArrayBuffer;
          headers: { "content-type": string };
        };

        let mimeType = headers["content-type"];
        if (!mimeType || mimeType === "audio/wave") {
          mimeType = "audio/wav";
        }
        setAudioFromDownload(data, mimeType);
      } catch (error) {
        console.log("Request failed or aborted", error);
      } finally {
        setProgress(undefined);
      }
    }
  };

  // When URL changes, download audio
  useEffect(() => {
    if (audioDownloadUrl) {
      const requestAbortController = new AbortController();
      downloadAudioFromUrl(requestAbortController);
      return () => {
        requestAbortController.abort();
      };
    }
  }, [audioDownloadUrl]);

  return (
    <>
      {!audioData && (
        <Dragger
          name="file"
          className="w-96 h-48"
          beforeUpload={(file) => {
            readAsyncFile(file).then(
              ({ decoded, blobUrl, mimeType }: any) => {
                const audioData = {
                  buffer: decoded,
                  url: blobUrl,
                  source: AudioSource.FILE,
                  mimeType: mimeType,
                };
                props.transcriber.onInputChange();
                props.onAudioData(audioData);
                setAudioData(audioData);
              },
            );
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <VideoCameraOutlined />
          </p>
          <p className="ant-upload-text">
            点击打开 mp4 文件
          </p>
        </Dragger>
      )}
    </>
  );
}

async function readAsyncFile(file: File) {
  // Create a blob that we can use as an src for our audio element
  return new Promise((resolve, reject) => {
    const urlObj = URL.createObjectURL(file);
    const mimeType = file.type;

    const reader = new FileReader();
    reader.addEventListener("load", async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer; // Get the ArrayBuffer
      if (!arrayBuffer) return;

      const audioCTX = new AudioContext({
        sampleRate: Constants.SAMPLING_RATE,
      });

      const decoded = await audioCTX.decodeAudioData(arrayBuffer);

      resolve({ decoded, blobUrl: urlObj, mimeType });
    });
    reader.readAsArrayBuffer(file);
  });
}

function Tile(props: {
  icon: JSX.Element;
  text?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      className="flex items-center justify-center rounded-lg p-2 bg-blue text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
    >
      <div className="w-7 h-7">{props.icon}</div>
      {props.text && (
        <div className="ml-2 break-text text-center text-md w-30">
          {props.text}
        </div>
      )}
    </button>
  );
}
