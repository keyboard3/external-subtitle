interface GlobalConfig {
  localSyncTime: number;
  configs: Config[];
}

type TranslateService = "google" | "bing";

interface Config {
  match: string | string[];
  enable: boolean;
  floatBall?: FloatBall;
  videoSelector?: string;
  videoContainerSelector?: string;
  captionWrapperSelector?: string;
  likeCaptionSelectors: string[];
  langSort: string[];
  ytAsrConfig: { [key: string]: YTAsrLngConfig };
  translationService: TranslateService;
  subtitleHook?: SubtitleHookConfig;
}
interface SubtitleHookConfig {
  subRegex: string;
  itemPath: string;
  startKey: string;
  endKey: string;
  textKey: string;
  timeDivisor?: number
}

interface YTAsrLngConfig {
  isSpaceLang: boolean;
  wordsRegex?: string; //特殊单词包含.的
  splitConfig: Partial<{
    symbolBreakWords?: string[];
    breakWords: string[];
    breakMiniTime: number;
    skipWords: string[];
    minInterval: number;
    maxWords: number;
  }>;
  mergeConfig: Partial<{
    endWords: string[];
    startWords: string[];
    minInterval: number;
    maxWords: number;
  }>;
  endCompatibleConfigs: {
    minInterval: number;
    minWordLength: number;
    sentenceMinWord: number;
  }[];
}

interface FloatBall {
  enable: boolean;
  top: string;
  right: string;
}

interface SubtitleCue {
  start: number;
  end: number;
  text?: string;
  i18n?: { [key: string]: string };
  requesting?: boolean;
}

interface SubtitlesData {
  url?: string;
  subtitles: SubtitleCue[];
  from:
    | "init"
    | "upload"
    | "req_yt"
    | "req_nst"
    | "req_common"
    | "crawl"
    | "cache";
}

type LanguageCode = "zh-CN" | "zh-TW" | "en" | "auto";

interface YoutubeRes {
  events: {
    aAppend?: number;
    dDurationMs?: number;
    tStartMs: number;
    wWinId?: number;
    wpWinPosId?: number;
    wsWinStyleId?: number;
    id?: number;
    segs?: { utf8: string; tOffsetMs?: number; acAsrConf?: number }[];
  }[];
}

interface BilibiliRes {
  body: {
    content: string;
    from: number;
    to: number;
  }[];
}

interface YoutubeWordCue {
  tStartMs: number;
  utf8: string;
  tEndMs?: number;
  isBreak?: boolean;
}

interface NSYoutubeRes {
  response: "OK";
  result: {
    start: number;
    end: number;
    segs: {
      start: number;
      end: number;
      text: string;
    }[];
  }[];
}

interface AccessToken {
  accessToken: string;
  accessTokenExpiresAt: number;
}

interface RateOption {
  rpm: number; //每分钟最多多少个请求
  series: number; //同时发送的请求数量
  group: number; //一组可以合并多少
  groupMaxText?: number; //一组最多少文本
  timeout?: number;
}

interface TranslateArgs {
  text: string;
  from: string;
  to: string;
}

interface TranslationServiceConfig {
  rateOption: RateOption;
  serviceKey: TranslateService;
  translateList: {
    (
      text: string[],
      from: string,
      to: string,
      timeout?: number,
    ): Promise<string[]>;
  };
}

interface TranslateTask {
  args: TranslateArgs;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}
