import { useCallback, useEffect, useRef, useState } from "react";
import { APP_NAME } from "../common/const";
import {
  detectLangByBrowser,
  getCacheSubtitles,
  getReqCrawlSubtitles,
  saveSubtitles,
  toAttachSubtitle,
  toCollectingSubtitles,
  toDisableSubtitle,
  toStopCollecting,
  toUpdateVideoPlayTime,
} from "../background/exports";
import message from "antd/es/message";
import { useTranslation } from "react-i18next";
import { Caption } from "../utils/subsrt-ts/lib/types/handler";
import subsrt from "../utils/subsrt-ts/lib/subsrt";
import FileSaver from "file-saver";
import debounce from "lodash.debounce";
import { formatSubtitles, sortLangKeys } from "../utils/subtitle";
import { getDocTitle, getUrl } from "../content/exports";
import { cancelQueue, translate } from "./translate";
import { syncConfigs } from "../common/config";

let defaultOpenArgs: any = null;
export function useOpenPanelArgs() {
  const [_, forceUpdate] = useState({});
  const openArgsRef = useRef<
    {
      tabKey: string;
      activeCrawlSub: boolean;
      captions: SubtitleCue[];
      activeApplySub: boolean;
    }
  >(defaultOpenArgs);
  useEffect(() => {
    const openPanel = (event: CustomEvent) => {
      const { type, activeCrawlSub, subtitles, activeApplySub } =
        event.detail || {};
      defaultOpenArgs = {
        tabKey: type || "applySub",
        activeCrawlSub: activeCrawlSub,
        captions: subtitles,
        activeApplySub,
      };
      openArgsRef.current = defaultOpenArgs;
      forceUpdate({});
    };
    document.addEventListener(APP_NAME + "openPanel", openPanel);
    return () => {
      document.removeEventListener(APP_NAME + "openPanel", openPanel);
    };
  }, [forceUpdate]);
  return openArgsRef;
}

export function openPanel(type: "applySub" | "crawlSub") {
}

export function useUpdateCollectorSubtitles(
  locationUrl: string,
  subsData: SubtitlesData,
  crawlActive: boolean,
  applyActive: boolean,
  updateSubtitles: (
    captions: SubtitleCue[],
    from?: SubtitlesData["from"],
  ) => void,
) {
  useEffect(() => {
    if (crawlActive || applyActive || !locationUrl) return;
    getCacheSubtitles(locationUrl).then((res) => {
      if (res?.url != locationUrl) return;
      updateSubtitles(res.subtitles, "cache");
      return res;
    }).then((res) => {
      // console.log("---cache", res);
      if (!res) {
        return getReqCrawlSubtitles(locationUrl);
      }
      return [];
    }).then((res) => {
      // console.log("---getReqCrawlSubtitles", res);
      if (!res.length) return;
      updateSubtitles(res);
    });
  }, [locationUrl, updateSubtitles]);
  useEffect(() => {
    const listenUpdateSubtitles = (event: any) => {
      const subtitleData: SubtitlesData = event?.detail ||
        {};
      if (!subtitleData) return;
      //自动抓取的数据，在启用了手动抓取的情况下放弃
      if (subsData.from == "cache") return;
      if (crawlActive && subsData.from.startsWith("req_")) return;
      updateSubtitles(subtitleData.subtitles, subtitleData.from);
    };

    document.addEventListener(
      APP_NAME + "updateCollectorSubtitles",
      listenUpdateSubtitles,
    );
    return () => {
      const key = APP_NAME + "updateCollectorSubtitles";
      document.removeEventListener(key, listenUpdateSubtitles);
    };
  }, [subsData, crawlActive, updateSubtitles]);
}

export function useTogglePanel() {
  const [visiblePanel, setVisiblePanel] = useState(false);
  const visiblePanelConst = useRef(visiblePanel);
  visiblePanelConst.current = visiblePanel;

  const handleToggle = useCallback(() => {
    setVisiblePanel(!visiblePanelConst.current);
  }, []);

  useEffect(() => {
    document.addEventListener(APP_NAME + "togglePanel", handleToggle);
    return () => {
      document.removeEventListener(APP_NAME + "togglePanel", handleToggle);
    };
  }, [handleToggle]);

  useEffect(() => {
    if (visiblePanel) {
      const style = document.createElement("style");
      style.id = APP_NAME + "style";
      style.innerHTML = `html {width: calc(100% - 280px)}`;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById(APP_NAME + "style");
      if (style) {
        style.remove();
      }
    }
  }, [visiblePanel]);

  // const openPanelArgs = useOpenPanelArgs();
  // useEffect(() => {
  //   if (!openPanelArgs) return;
  //   setVisiblePanel(true);
  // }, [openPanelArgs]);

  return {
    visiblePanel,
    handleToggle,
  };
}

export function useOnCrawlCaptions(
  crawlActive: boolean,
  setCrawlActive: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const { t } = useTranslation();
  const disableCollect = useCallback(() => {
    toStopCollecting();
    setCrawlActive(false);
  }, [setCrawlActive]);

  const onCrawlCaptions = useCallback(async () => {
    if (crawlActive) {
      disableCollect();
      return;
    }

    const isOk = await Promise.race([
      toCollectingSubtitles(),
      new Promise((resolve) => setTimeout(() => resolve(false), 200)),
    ]) as boolean;
    if (isOk) {
      message.success(t("crawlBegin"));
    } else {
      message.error(t("crawlFail"));
    }
    setCrawlActive(isOk);
  }, [crawlActive, setCrawlActive, disableCollect]);
  return [disableCollect, onCrawlCaptions];
}

export function useApplySubtitles(
  updateSubtitles: (subtitles: SubtitleCue[]) => void,
  setApplyActive: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const { t } = useTranslation();
  const applySubtitles = useCallback(async (subtitles: SubtitleCue[]) => {
    updateSubtitles(subtitles);
    const isOk = await Promise.race([
      toAttachSubtitle(subtitles),
      new Promise((resolve) => setTimeout(() => resolve(false), 200)),
    ]) as boolean;
    if (isOk) {
      message.success(t("applySuccess"));
      toUpdateVideoPlayTime(subtitles[0].start);
    } else {
      message.error(t("applyFailed"));
    }
    setApplyActive(isOk);
  }, [updateSubtitles, setApplyActive]);
  return applySubtitles;
}

export function useOnApplyCaptions(
  subsData: SubtitlesData,
  applyActive: boolean,
  setApplyActive: React.Dispatch<React.SetStateAction<boolean>>,
  applyCaptions: (captions: SubtitleCue[]) => Promise<void>,
) {
  const autoApplyRef = useRef<boolean>(false);

  //上传后自动挂载到字幕
  useEffect(() => {
    if (
      autoApplyRef.current && subsData.from == "upload" &&
      subsData.subtitles.length
    ) {
      applyCaptions(subsData.subtitles);
    }
  }, [subsData.from, autoApplyRef, applyCaptions]);

  const onApplyCaptions = useCallback(async (e: any) => {
    toDisableSubtitle();
    if (applyActive) {
      setApplyActive(false);
      return;
    }

    const formatCaptions = await formatSubtitles(subsData.subtitles);

    if (!formatCaptions.length) {
      const docEle = (e.target as HTMLElement).getRootNode() as any;
      const ele = docEle.querySelector(
        "#upload-subtitle [type='file']",
      ) as any;
      if (!ele) return;
      ele.click();
      autoApplyRef.current = true;
      return;
    }
    applyCaptions(formatCaptions);
  }, [subsData, applyActive, setApplyActive, autoApplyRef]);
  return onApplyCaptions;
}

export function useOnDownloadCaptions(
  subsData: SubtitlesData,
  langSort?: string[],
  setDownloaded?: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const onDownloadCaptions = useCallback(async () => {
    const docTitle = await getDocTitle();
    let newSubs = subsData.subtitles.map((item) => {
      let text = item.text;
      if (item.i18n) {
        const keys = sortLangKeys(Object.keys(item.i18n), langSort);
        text = keys.map((key) => item.i18n[key]).reduceRight(
          (prev, cur) => cur + "\n" + prev,
          "",
        );
      }
      return {
        start: item.start * 1000,
        text: text,
        end: item.end * 1000,
      } as Caption;
    });
    const content = subsrt.build(newSubs, { format: "srt" });
    const contentBlob = new Blob([content], { type: "text/plain" });
    const filename = (docTitle || document.title) + ".srt";
    await FileSaver.saveAs(contentBlob, filename);
    setDownloaded?.(true);
  }, [setDownloaded, subsData, langSort]);
  return onDownloadCaptions;
}

export function useUrlChange() {
  const locationUrlRef = useRef("");
  const [_, forceRefresh] = useState({});

  useEffect(() => {
    getUrl().then((url) => {
      locationUrlRef.current = url;
      forceRefresh({});
    });
    function listenUrlChange(e: any) {
      if (locationUrlRef.current == e.detail) return;
      locationUrlRef.current = e.detail;
      forceRefresh({});
    }
    document.addEventListener(APP_NAME + "urlChange", listenUrlChange);
    return () => {
      document.removeEventListener(APP_NAME + "urlChange", listenUrlChange);
    };
  }, [locationUrlRef, forceRefresh]);
  return locationUrlRef.current;
}

export function usePlusCaptions(
  captions: SubtitleCue[],
  setCaptions: React.Dispatch<React.SetStateAction<SubtitleCue[]>>,
) {
  const plusCaption = useCallback(
    debounce((plus: number) => {
      setCaptions(captions.map((item) => ({
        ...item,
        start: Math.max(0, item.start + plus) as number,
        end: item.end + plus,
      })));
    }, 200),
    [captions, setCaptions],
  );
  return plusCaption;
}

export function useMovePlayCue(subsData: SubtitlesData, applyActive: boolean) {
  const [cueStart, setCueStart] = useState<number>();
  const subsRef = useRef<HTMLUListElement>();
  useEffect(() => {
    function updateCue({ detail }: any) {
      if (!detail || !applyActive) return;
      setCueStart(detail.start);
      const index = subsData.subtitles?.findIndex((item) =>
        item.start == detail.start
      );
      if (!subsRef.current) return;
      const subItem = subsRef.current.querySelector(
        `li:nth-child(${index + 1})`,
      ) as HTMLElement;
      const offsetTop = subsRef.current.offsetTop;
      const itemOffsetTop = subItem?.offsetTop;
      const clientHeight = subsRef.current.clientHeight;
      const scrollHeight = subsRef.current.scrollHeight;
      const scrollTop = subsRef.current.scrollTop;
      if (scrollTop >= scrollHeight - clientHeight) return;

      const subItemTop = itemOffsetTop - offsetTop;
      const visibleBottomTop = scrollTop + clientHeight;
      if (visibleBottomTop - subItemTop < clientHeight * 0.4) {
        const prevSubItem = subsRef.current.querySelector(
          `li:nth-child(${index})`,
        ) as HTMLElement;
        subsRef.current?.scrollTo({
          top: prevSubItem.offsetTop - offsetTop,
          behavior: "smooth",
        });
      }
    }
    document.addEventListener(APP_NAME + "cueChange", updateCue);
    return () => {
      document.removeEventListener(APP_NAME + "cueChange", updateCue);
    };
  }, [applyActive, setCueStart, subsData, subsRef]);
  return [cueStart, subsRef] as const;
}

export function useTranslateSubtitles(
  config: Config,
  locationUrl: string,
  subsData: SubtitlesData,
  lang: string,
  forceUpdate: (data: any) => void,
  translateActive: boolean,
  setTranslateActive: React.Dispatch<React.SetStateAction<boolean>>,
) {
  return useCallback(async () => {
    cancelQueue();
    if (translateActive) {
      setTranslateActive(false);
      return;
    }
    setTranslateActive(true);
    const allText = subsData.subtitles.map((item) => item.text).join(" ")
      .substring(0, 200);
    const from = await detectLangByBrowser(allText, "en");

    let resultCount = 0;
    subsData.subtitles.forEach((cue) => {
      cue.requesting = true;
      translate(config.translationService, {
        text: cue.text,
        from,
        to: lang,
      }).then((res: string) => {
        cue.i18n = {};
        cue.i18n[from] = cue.text;
        cue.i18n[lang] = res;
        cue.requesting = false;
        saveSubtitles(locationUrl, subsData);
        handleResult(cue);
      }).catch((err) => {
        handleResult(cue);
        throw err;
      });
    });
    function handleResult(cue: SubtitleCue) {
      cue.requesting = false;
      forceUpdate({});
      resultCount++;
      if (resultCount >= subsData.subtitles.length) {
        setTranslateActive(false);
      }
    }
    forceUpdate({});
  }, [
    config,
    locationUrl,
    subsData,
    lang,
    forceUpdate,
    translateActive,
    setTranslateActive,
  ]);
}

export function useRuleUpdate() {
  useEffect(() => {
    syncConfigs();
  }, []);
}
