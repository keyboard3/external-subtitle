declare namespace VideoJsNS {
  interface PlayerOptions {
    // Standard <video> Element Options
    autoplay?: boolean | string;
    controlBar?: {
      remainingTimeDisplay?: {
        displayNegative?: boolean;
      };
    };
    controls?: boolean;
    height?: string | number;
    loop?: boolean;
    muted?: boolean;
    poster?: string;
    preload?: "auto" | "metadata" | "none";
    src?: string;
    width?: string | number;

    // Video.js-specific Options
    aspectRatio?: string;
    audioOnlyMode?: boolean;
    audioPosterMode?: boolean;
    autoSetup?: boolean;
    breakpoints?: {
      [key: string]: number;
    };
    children?: Array<string> | object;
    disablePictureInPicture?: boolean;
    enableDocumentPictureInPicture?: boolean;
    experimentalSvgIcons?: boolean;
    fluid?: boolean;
    fullscreen?: {
      options?: {
        navigationUI?: string;
      };
    };
    id?: string;
    inactivityTimeout?: number;
    language?: string;
    languages?: object;
    liveui?: boolean;
    liveTracker?: {
      trackingThreshold?: number;
      liveTolerance?: number;
    };
    nativeControlsForTouch?: boolean;
    normalizeAutoplay?: boolean;
    notSupportedMessage?: string;
    noUITitleAttributes?: boolean;
    playbackRates?: number[];
    plugins?: object;
    preferFullWindow?: boolean;
    responsive?: boolean;
    restoreEl?: boolean | Element;
    skipButtons?: {
      forward?: number;
      backward?: number;
    };
    sources?: Array<Source>;
    suppressNotSupportedError?: boolean;
    techCanOverridePoster?: boolean;
    techOrder?: string[];
    userActions?: {
      click?: boolean | Function;
      doubleClick?: boolean | Function;
      hotkeys?: boolean | Function | object;
    };
    vttjs?: string;

    // Component Options
    // [componentName: string]: any;

    // Tech Options
    // [techName: string]: any;
  }

  interface Source {
    type: string;
    src: string;
  }

  interface Player {
    play(): Player;
    pause(): Player;
    paused(): boolean;
    src(newSource: string | Source | Source[]): Player;
    currentTime(seconds: number): Player;
    currentTime(): number;
    duration(): number;
    buffered(): TimeRanges;
    bufferedPercent(): number;
    volume(percentAsDecimal: number): TimeRanges;
    volume(): number;
    width(): number;
    width(pixels: number): Player;
    height(): number;
    height(pixels: number): Player;
    size(width: number, height: number): Player;
    requestFullScreen(): Player;
    cancelFullScreen(): Player;
    ready(callback: (this: Player) => void): Player;
    on(eventName: string, callback: (eventObject: Event) => void): void;
    off(eventName?: string, callback?: (eventObject: Event) => void): void;
    dispose(): void;
    addTextTrack: (kind: string, label: string, language: string) => TextTrack;
    textTracks: () => TextTrack[];
    poster(val?: string): string | Player;
    playbackRate(rate?: number): number;
    isDisposed: () => boolean;
  }
}
