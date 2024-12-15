import { useCallback, useEffect, useRef, useState } from "react";
import {
  toDisableSubtitle,
  toStopCollecting,
  toUpdateVideoCaption,
  toUpdateVideoPlayTime,
} from "../background/exports";
import React from "react";
import styles from "./index.module.css";
import { useTranslation } from "react-i18next";
import Col from "antd/es/col";
import Button from "antd/es/button";
import CloudDownloadOutlined from "@ant-design/icons/lib/icons/CloudDownloadOutlined";
import Row from "antd/es/row";
import Space from "antd/es/space";
import List from "antd/es/list";
import Tag from "antd/es/tag";
import { formatTime } from "../utils/time";
import {
  useApplySubtitles,
  useMovePlayCue,
  useOnApplyCaptions,
  useOnCrawlCaptions,
  useOnDownloadCaptions,
  useTranslateSubtitles,
  useUpdateCollectorSubtitles,
  useUrlChange,
} from "./hooks";
import { formatSubtitles, sortLangKeys } from "../utils/subtitle";
import Upload from "antd/es/upload";
import UploadOutlined from "@ant-design/icons/lib/icons/UploadOutlined";
import subsrt from "../utils/subsrt-ts/lib/subsrt";
import debounce from "lodash.debounce";
import { useConfig } from "../common/hooks";
import Spin from "antd/es/spin";
import { Tooltip } from "antd";
import classNames from "classnames";
import Dropdown from "antd/lib/dropdown";
import { allTranslationServices } from "../common/const";

export default function Subtitles(
  { activeCrawlSub, activeApplySub, captionsArg }: {
    activeCrawlSub?: boolean;
    activeApplySub?: boolean;
    captionsArg?: SubtitleCue[];
  },
) {
  const [_, forceUpdate] = useState<any>({});
  const captionsRef = useRef<SubtitlesData>({
    subtitles: captionsArg || [],
    from: "init",
  });
  const { subtitles } = captionsRef.current;

  const { t } = useTranslation();
  const [crawlActive, setCrawlActive] = useState(activeCrawlSub);
  const [applyActive, setApplyActive] = useState(activeApplySub);
  const [translateActive, setTranslateActive] = useState(false);

  const [config, setConfig] = useConfig();
  const locationUrl = useUrlChange();

  const resetUI = useCallback(() => {
    setCrawlActive(false);
    setApplyActive(false);
    setTranslateActive(false);
    toStopCollecting();
    toDisableSubtitle();
  }, [setCrawlActive, setApplyActive, setTranslateActive]);

  useEffect(() => {
    resetUI();
  }, [locationUrl]);

  const updateSubtitles = useCallback(
    (subtitles: SubtitleCue[], from?: SubtitlesData["from"]) => {
      console.log("updateSubtitles", subtitles, from);
      if (from) captionsRef.current.from = from;
      captionsRef.current.subtitles = subtitles;
      forceUpdate({});
    },
    [captionsRef, forceUpdate],
  );

  const onUploadSubtitles = useCallback((subtitles: SubtitleCue[]) => {
    captionsRef.current = {
      subtitles,
      from: "upload",
    };
    forceUpdate({});
  }, [captionsRef, forceUpdate]);

  useUpdateCollectorSubtitles(
    locationUrl,
    captionsRef.current,
    crawlActive,
    applyActive,
    updateSubtitles,
  );

  const [disableCollect, onCrawlCaptions] = useOnCrawlCaptions(
    crawlActive,
    setCrawlActive,
  );

  const onTranslateSubtitles = useTranslateSubtitles(
    config,
    locationUrl,
    captionsRef.current,
    "zh-CN",
    forceUpdate,
    translateActive,
    setTranslateActive,
  );
  const applyCaptions = useApplySubtitles(updateSubtitles, setApplyActive);
  const onApplyCaptions = useOnApplyCaptions(
    captionsRef.current,
    applyActive,
    setApplyActive,
    applyCaptions,
  );

  const updateSubtitleValue = useCallback(
    debounce((index: number, text: string, lang?: string) => {
      if (lang && subtitles[index].i18n?.[lang]) {
        subtitles[index].i18n[lang] = text;
      } else {
        subtitles[index].text = text;
      }
      if (applyActive) {
        toUpdateVideoCaption(index, subtitles[index]);
      }
    }, 200),
    [applyActive, subtitles],
  );

  const [playCueStart, subsRef] = useMovePlayCue(
    captionsRef.current,
    applyActive,
  );
  const options = allTranslationServices.map((item) => ({
    key: item,
    label: item,
  }));
  const onMenuClick = useCallback((e: any) => {
    setConfig({ translationService: e.key });
  }, [setConfig]);
  return (
    <>
      <Row className={styles["actions"]}>
        <Space>
          <Col hidden={crawlActive}>
            <Tooltip
              title={translateActive ? t("stopTranslate") : t("translateTip")}
            >
              <Dropdown.Button
                menu={{ items: options, onClick: onMenuClick }}
                onClick={onTranslateSubtitles}
              >
                {translateActive
                  ? t("stopTranslate")
                  : (config.translationService || "") + t("translate")}
              </Dropdown.Button>
            </Tooltip>
          </Col>
          <Col hidden={applyActive}>
            <Tooltip
              title={crawlActive ? t("stopCrawl") : t("crawlVideoSubtitleTip")}
            >
              <Button
                onClick={() => {
                  captionsRef.current.from = "crawl";
                  onCrawlCaptions();
                }}
                type={crawlActive ? "primary" : "default"}
              >
                {crawlActive ? t("stopCrawl") : t("crawlVideoSubtitle")}
              </Button>
            </Tooltip>
          </Col>
          <Col>
            <UploadSubtitle onUploadSubtitles={onUploadSubtitles} />
          </Col>
          <Col hidden={!subtitles.length}>
            <Tooltip
              title={applyActive ? t("stopApply") : t("applyVideoTip")}
            >
              <Button
                onClick={(e: any) => {
                  disableCollect();
                  onApplyCaptions(e);
                }}
                type={applyActive ? "primary" : "default"}
              >
                {applyActive ? t("stopApply") : t("applyVideo")}
              </Button>
            </Tooltip>
          </Col>
          <Col hidden={!subtitles.length}>
            <DownloadSubtitlesButton
              subsData={captionsRef.current}
              langSort={config.langSort}
            />
          </Col>
        </Space>
      </Row>
      <ul
        ref={subsRef}
        style={{ height: "100%" }}
        className={styles["panel-subs"]}
      >
        {subtitles.map((sub, index) => {
          const captionActiveClasses = {
            [styles["text-active"]]: playCueStart == sub.start,
          };
          return (
            <li>
              <div
                className={classNames(
                  styles["time-range"],
                  captionActiveClasses,
                )}
                onClick={() => {
                  toUpdateVideoPlayTime(sub.start);
                }}
              >
                {formatTime(sub.start)}
              </div>
              {renderText(
                classNames(styles["caption-text"], captionActiveClasses),
                sub,
                index,
                config.langSort,
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  function renderText(
    className: string,
    cue: SubtitleCue,
    index: number,
    langSort: string[],
  ) {
    if (!cue) return null;
    if (!cue.i18n) {
      return (
        <div
          className={className}
          contentEditable={!crawlActive}
          onInput={(e: any) => {
            updateSubtitleValue(index, e.target.innerText);
          }}
        >
          {cue.text}
          <Spin size="small" spinning={!!cue.requesting} />
        </div>
      );
    }

    const langKeys = sortLangKeys(Object.keys(cue.i18n), langSort);
    return (
      <div className={styles["caption-wrapper"]}>
        <Spin size="small" spinning={!!cue.requesting}>
          {langKeys.map((lang) => {
            return (
              <div
                className={className}
                contentEditable={!crawlActive}
                onInput={(e: any) => {
                  updateSubtitleValue(index, e.target.innerText, lang);
                }}
              >
                {cue.i18n[lang]}
              </div>
            );
          })}
        </Spin>
      </div>
    );
  }
}

function UploadSubtitle(
  { onUploadSubtitles }: {
    onUploadSubtitles: (captions: SubtitleCue[]) => void;
  },
) {
  const { t } = useTranslation();
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const beforeUpload = useCallback((file: File) => {
    var reader = new FileReader();
    setLoading(true);
    reader.onload = function () {
      const captions = subsrt.parse(reader.result as string);
      setTimeout(async () => {
        setUploaded(true);
        const formatCaptions = await formatSubtitles(captions as any[]);
        onUploadSubtitles(formatCaptions);
      }, 200);
      setTimeout(() => setLoading(false), 1500);
    };
    reader.readAsText(file);
    return false;
  }, [setLoading]);
  return (
    <div id="upload-subtitle">
      <Upload
        name="file"
        accept=".srt,.ass"
        multiple={false}
        showUploadList={false}
        beforeUpload={beforeUpload}
      >
        <Tooltip title={t("uploadTip")}>
          <Button
            type={uploaded ? "primary" : "default"}
            loading={loading}
            icon={<UploadOutlined />}
            shape="circle"
          />
        </Tooltip>
      </Upload>
    </div>
  );
}

function DownloadSubtitlesButton(
  { subsData, langSort }: { subsData: SubtitlesData; langSort: string[] },
) {
  const [downloaded, setDownloaded] = useState(false);
  const onDownloadCaptions = useOnDownloadCaptions(
    subsData,
    langSort,
    setDownloaded,
  );
  const { t } = useTranslation();
  return (
    <Tooltip title={t("downloadTip")}>
      <Button
        type={downloaded ? "primary" : "default"}
        onClick={onDownloadCaptions}
        icon={<CloudDownloadOutlined />}
        shape="circle"
      />
    </Tooltip>
  );
}
