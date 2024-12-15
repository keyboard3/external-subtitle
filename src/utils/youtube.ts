export function formatEventsToSubtitles(
  events: YoutubeRes["events"],
  lang: string,
  ytAsrConfig: Config["ytAsrConfig"],
) {
  try {
    const config = getLangConfig(lang, ytAsrConfig);
    console.log("config", lang, config);
    if (!config) return eventsToSentences(events);

    //将YT字幕转成语气词字幕
    const cues = eventsToWordCues(events, config.isSpaceLang);

    if (isLongWords(config, cues)) {
      return formatCuesToSubtitles(cues);
    }

    const symbolList = splitSymbolCues(cues, {
      wordRegexStr: config.wordsRegex,
    });
    if (symbolList?.length) {
      console.log("symbolList", symbolList);
      const resultGroups: YoutubeWordCue[][] = [];
      const splitConfig = config.splitConfig;
      symbolList.forEach((symCues) => {
        let splitPauseList = getSplitCues(symCues, {
          breakWords: splitConfig.symbolBreakWords,
          skipWords: splitConfig.skipWords,
          minInterval: splitConfig.minInterval * 5,
          maxWords: splitConfig.maxWords || 25,
          breakMiniTime: splitConfig.breakMiniTime || 500,
        });
        resultGroups.push(...splitPauseList);
      });
      return formatGroupsToSubtitles(resultGroups);
    }

    //根据说话停顿时间来拆分字幕句子
    const splitConfig = config.splitConfig;
    let splitPauseList = getSplitCues(cues, {
      breakWords: splitConfig.breakWords,
      skipWords: splitConfig.skipWords,
      minInterval: splitConfig.minInterval,
      maxWords: splitConfig.maxWords,
      breakMiniTime: splitConfig.breakMiniTime || 500,
    });
    console.log("splitPauseList", splitPauseList);
    //将可能存在前、后句子中的关键词的句子进行合并
    const mergeConfig = config.mergeConfig;
    const mergedList = mergeNextWords(splitPauseList, {
      endWords: mergeConfig?.endWords,
      startWords: mergeConfig?.startWords,
      minInterval: mergeConfig.minInterval,
      maxWords: mergeConfig.maxWords,
    });
    console.log(
      "mergeNextEndWords end",
      JSON.parse(JSON.stringify(mergedList)),
    );

    let compatibleList = mergedList;
    for (const endConfig of (config.endCompatibleConfigs || [])) {
      //最后根据有效时间内的短词来假设合并用户故意停顿的短剧
      compatibleList = compatibleCues(compatibleList, {
        minInterval: endConfig.minInterval,
        minWordLength: endConfig.minWordLength,
        sentenceMinWord: endConfig.sentenceMinWord,
      });
    }

    //最后将结果转换成内部的YT字幕
    return formatGroupsToSubtitles(compatibleList);
  } catch (err) {
    console.error(err);
    return [];
  }
}

function isLongWords(config: YTAsrLngConfig, cues: YoutubeWordCue[]) {
  if (config.isSpaceLang) {
  }
  return cues.slice(0, 20).find((cue) => {
    if (config.isSpaceLang) return cue.utf8.trim().split(/\s+/).length >= 3;
    return cue.utf8.trim().length >= 4;
  });
}

function getLangConfig(
  lang: string,
  ytAsrConfig: Config["ytAsrConfig"],
): YTAsrLngConfig | null {
  const base = ytAsrConfig.base as any;
  let config = ytAsrConfig[lang];
  if (!config) {
    if (lang.startsWith("zh")) {
      config = ytAsrConfig.zh;
    }
  }
  if (!config) return null;
  const newConfig = { ...base, ...JSON.parse(JSON.stringify(config)) };
  Object.entries(newConfig).forEach(([key, value]) => {
    if (typeof value != "object" || Array.isArray(value)) return;
    if (value == base[key]) return;
    newConfig[key] = {
      ...base[key],
      ...newConfig[key],
    };
  });
  return newConfig;
}

//将YT网络请求的响应结果转换成尽可能单词为边界的数组
function eventsToWordCues(
  events: YoutubeRes["events"],
  isSpaceLang: boolean,
): YoutubeWordCue[] {
  let smallCharLength = 0;

  let cues: YoutubeWordCue[] = [];
  let lastCueI18n = "";
  events.forEach((event, index) => {
    event.segs?.forEach((seg) => {
      if (!isSpaceLang) {
        cues.push({
          tStartMs: event.tStartMs,
          utf8: seg.utf8,
        });
        return;
      }

      if (seg.utf8 == "\n") {
        lastCueI18n = " ";
        return;
      }
      if (/[a-z]/.test(seg.utf8)) {
        smallCharLength++;
      }

      cues.push({
        tStartMs: event.tStartMs + (seg.tOffsetMs || 0),
        utf8: (lastCueI18n + seg.utf8).toLocaleLowerCase(),
      });
      lastCueI18n = "";
    });
    if (event.dDurationMs && cues.length > 0) {
      cues[cues.length - 1].tEndMs = event.tStartMs + event.dDurationMs;
    }
  });

  if (!isSpaceLang) return cues;

  //需要将字符合并成单词
  if (smallCharLength <= events.length * 0.1) {
    cues = charToWordEvents(cues);
  }
  return cues;
}

function eventsToSentences(events: YoutubeRes["events"]) {
  let cues: SubtitleCue[] = [];
  events.forEach((event, index) => {
    const startTime = event.tStartMs;
    const endTime = event.tStartMs + event.dDurationMs;
    let text = "";
    event.segs?.forEach((seg) => {
      text += seg.utf8;
    });
    cues.push({
      start: startTime,
      end: endTime,
      text,
    });
  });
  return cues;
}

//将YT中全部是大写字母且字符之间有空格间距的合并成单词
function charToWordEvents(cues: YoutubeWordCue[]) {
  const resCues: YoutubeWordCue[] = [];

  let stackChars: YoutubeWordCue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    let isInStack = false;
    if (/[a-z]/.test(cue.utf8)) {
      stackChars.push(cue);
      isInStack = true;
    }
    if (/^[a-z'.]+\s*[a-z'.]+$/.test(cue.utf8)) continue;
    if (stackChars.length == 1 && /\b[a-z.']+$/.test(cue.utf8)) continue;

    if (/[a-z]/.test(cue.utf8) && /^[^a-z]/.test(cue.utf8)) {
      stackChars.pop();
      pushStack();
      stackChars = [cue];
      continue;
    }
    if (stackChars.length) {
      pushStack();
      stackChars = [];
    }
    if (!isInStack) {
      resCues.push(cue);
    }
  }
  pushStack();
  return resCues;
  function pushStack() {
    if (!stackChars.length) return;
    resCues.push({
      tStartMs: stackChars[0].tStartMs,
      utf8: stackChars.map((item) => item.utf8).reduceRight((prev, cur) =>
        cur + prev
      ),
    });
  }
}

interface SplitOption {
  breakWords: string[];
  skipWords: string[];
  breakMiniTime: number;
  minInterval: number;
  maxWords: number;
}

//通过说话停顿间隔时间来分割字幕句子
function getSplitCues(cues: YoutubeWordCue[], option: SplitOption) {
  const groups = splitPauseCues(cues, {
    ...option,
  });
  const result: YoutubeWordCue[][] = [];
  let latestCues: YoutubeWordCue[] = [];
  groups.forEach((group) => {
    const words = getWordsFromCues(group);
    if (words > option.maxWords && group.length > 1) {
      popLatestCuesToResult();
      const childGroups = getSplitCues(group, {
        ...option,
        minInterval: option.minInterval - 100,
      });
      result.push(...childGroups);
      return;
    } else if (group.length == 1 && getWordsFromCues(group) <= 1) {
      latestCues.push(group[0]);
      return;
    }
    popLatestCuesToResult();
    result.push(group);
  });
  popLatestCuesToResult();
  return result;
  function popLatestCuesToResult() {
    if (!latestCues.length) return;
    result.push(latestCues);
    latestCues = [];
  }
}

//通过英文中一些明显的关键词来分隔
function splitPauseCues(
  cues: YoutubeWordCue[],
  { breakWords, skipWords, minInterval, breakMiniTime }: SplitOption,
) {
  let lastSpeakTime = cues[0].tStartMs;
  const groups: YoutubeWordCue[][] = [];
  let latestGroup: YoutubeWordCue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const nextCue = cues[i + 1];
    const diffTime = cue.tStartMs - lastSpeakTime;
    if (breakWords?.includes(cue.utf8.trim()) && diffTime > breakMiniTime) {
      breakNewGroup(cue, [cue]);
      continue;
    }
    if (
      nextCue && breakWords?.includes((cue.utf8 + nextCue.utf8).trim()) &&
      diffTime > breakMiniTime
    ) {
      breakNewGroup(cue, [cue, nextCue]);
      i++;
      continue;
    }

    if (skipWords?.includes(cue.utf8.trim()) && cues[i + 1]) {
      lastSpeakTime = cues[i + 1].tStartMs;
      latestGroup.push(cues[i + 1]);
      i++;
      continue;
    }

    if (diffTime <= minInterval) {
      lastSpeakTime = cue.tStartMs;
      latestGroup.push(cue);
      continue;
    }

    groups.push(latestGroup);
    latestGroup = [cue];
    lastSpeakTime = cue.tStartMs;
  }
  if (latestGroup.length) {
    groups.push(latestGroup);
  }
  return groups.filter((item) => item.length > 0);
  function breakNewGroup(cue: YoutubeWordCue, cues: YoutubeWordCue[]) {
    lastSpeakTime = cue.tStartMs;
    groups.push(latestGroup);
    latestGroup = cues;
    cues[0].isBreak = true;
  }
}

//通过英文中明显成句的关键词来合并句子
function mergeNextWords(groups: YoutubeWordCue[][], {
  startWords,
  endWords,
  minInterval,
  maxWords,
}: {
  startWords: string[];
  endWords: string[];
  minInterval: number;
  maxWords: number;
}) {
  if (!startWords.length && !endWords.length) return groups;

  const resultGroup: YoutubeWordCue[][] = [groups[0]];
  const endWordsRegex = new RegExp(`\\b(${endWords.join(`|`)})\\s*$`, "ig");
  const startWordsRegex = new RegExp(`^\\s*(${startWords.join(`|`)})$`, "ig");
  for (let i = 0; i < groups.length - 1;) {
    const endWord = groups[i][groups[i].length - 1];
    const nextStartWord = groups[i + 1][0];
    const diffTime = nextStartWord.tStartMs - endWord.tStartMs;

    const latestGroup = resultGroup[resultGroup.length - 1];
    if (
      (
        nextStartWord.utf8.match(startWordsRegex) ||
        endWord.utf8.match(endWordsRegex)
      ) &&
      !nextStartWord.isBreak &&
      diffTime <= minInterval
    ) {
      const tempGroup = [...latestGroup, ...groups[i + 1]];
      if (getWordsFromCues(tempGroup) <= maxWords) {
        latestGroup.push(...groups[i + 1]);
      } else {
        resultGroup.push(groups[i + 1]);
      }
    } else {
      resultGroup.push(groups[i + 1]);
    }
    i++;
  }

  return resultGroup;
}

function getWordsFromCues(cues: YoutubeWordCue[]) {
  let text = "";
  cues?.forEach((cue) => text += cue.utf8);
  return text.split(/\s+/).length;
}

//通过判断少量单词且在有效时间内就认为是用户故意停顿产生的句子，可以和主句子合并
function compatibleCues(
  groups: YoutubeWordCue[][],
  { minInterval, minWordLength, sentenceMinWord }: {
    minInterval: number;
    minWordLength: number;
    sentenceMinWord: number;
  },
) {
  const cloneGroup = [...groups];
  for (let i = cloneGroup.length - 1; i > 0; i--) {
    const curGroup = cloneGroup[i];
    const prevGroup = cloneGroup[i - 1];
    if (curGroup.length <= 0 || curGroup.length > minWordLength) continue;
    if (curGroup.length + prevGroup.length >= sentenceMinWord) continue;

    const diffMs = curGroup[0].tStartMs -
      prevGroup[prevGroup.length - 1].tStartMs;
    if (diffMs > minInterval) continue;
    if (curGroup[0].isBreak) continue;

    prevGroup.push(...curGroup);
    cloneGroup.splice(i, 1);
  }
  return cloneGroup;
}

//将最后的语气词组合并成最后的句子
function formatGroupsToSubtitles(
  groups: YoutubeWordCue[][],
) {
  const subtitles: SubtitleCue[] = [];
  for (let i = 0; i < groups.length; i++) {
    const cues = groups[i];
    let text = "";
    cues.forEach((seg) => text += seg.utf8);
    const endTime = getEndTime(cues, groups[i + 1]);
    const cue: SubtitleCue = {
      start: cues[0].tStartMs,
      end: endTime,
      text: text.replace(/\n/ig, " "),
    };
    subtitles.push(cue);
  }
  return subtitles;
}

function getEndTime(cues: YoutubeWordCue[], nextCues: YoutubeWordCue[]) {
  const endTime = cues[cues.length - 1].tEndMs;
  const nextStartTime = nextCues?.[0]?.tStartMs ||
    cues[cues.length - 1].tStartMs;

  if (!endTime || endTime > nextStartTime) {
    return nextStartTime;
  }
  return endTime;
}

function formatCuesToSubtitles(
  cues: YoutubeWordCue[],
) {
  const subtitles: SubtitleCue[] = cues.map((cue) => {
    return {
      start: cue.tStartMs,
      end: cue.tEndMs || (cue.tStartMs + 10 * 1000),
      text: cue.utf8,
    };
  });
  return subtitles;
}

const events: YoutubeRes["events"] = [];

export function splitSymbolCues(
  cues: YoutubeWordCue[],
  { wordRegexStr }: {
    wordRegexStr?: string;
  },
): YoutubeWordCue[][] | null {
  if (!cues.length) return null;
  const symbolRegex = /[.?!。？!]/;

  const symbolLength = cues.filter((cue) => {
    return !!cue.utf8?.match(symbolRegex);
  })?.length || 0;
  if (symbolLength < 10) return null;

  const wordRegex = new RegExp(wordRegexStr);
  const cuesGroup: YoutubeWordCue[][] = [];
  let stackCues: YoutubeWordCue[] = [];
  cues.forEach((cue) => {
    const endUtf8 = cue.utf8.trim();
    const endChar = endUtf8[endUtf8.length - 1];
    stackCues.push(cue);
    if (endChar?.match(symbolRegex) && !endUtf8?.match(wordRegex)) {
      cuesGroup.push(stackCues.slice());
      stackCues = [];
    }
  });
  return cuesGroup;
}
