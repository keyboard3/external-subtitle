export function isMainFrame() {
  return window === window.top;
}

export function arrayOrGenericToArray<T>(arrayOrGeneric?: T | T[]): T[] {
  if (Array.isArray(arrayOrGeneric)) {
    return arrayOrGeneric;
  } else if (arrayOrGeneric) {
    return [arrayOrGeneric];
  } else {
    return [];
  }
}

export function parseJWT(token: string): AccessToken {
  const parts = token.split(".");
  if (parts.length <= 1) {
    throw new Error("invalid token");
  }
  const base64Url = parts[1];
  if (!base64Url) {
    throw new Error("invalid base64 url token");
  }

  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    globalThis.atob(base64).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""),
  );

  const parsed = JSON.parse(jsonPayload) as {
    sub: string;
    exp: number;
  };
  return {
    accessToken: token,
    accessTokenExpiresAt: parsed.exp * 1000,
  };
}

export function matchRegexList(regexList: string[], text: string) {
  const result = regexList.find((regex) => {
    const matches = regex.match(/^\/(.+)\/([a-z]{0,4})$/);
    let pattern = new RegExp(regex, "gi");
    if (matches && matches.length > 2) {
      pattern = new RegExp(matches[1], matches[2]);
    }
    return text.match(pattern);
  });
  return result;
}

/**
 * 根据路径获取对象的值
 * @param obj
 * @param path 'a.b.c'
 */
export function parseValue(obj: any, path: string) {
  if (Array.isArray(obj)) return obj;

  const paths = path.split(".");
  let current = obj;
  for (let i = 0; i < paths.length; i++) {
    if (!current) return null;
    current = current[paths[i]];
  }
  return current;
}

export function parseSubtitlesByArrayKeys(
  caption: any,
  hookConfig: SubtitleHookConfig,
) {
  if (!hookConfig) return null;

  const startArray = caption[hookConfig.startKey || ""];
  const endArray = caption[hookConfig.endKey || ""];
  const textArray = caption[hookConfig.textKey || ""];

  const isOk = Array.isArray(startArray) &&
    startArray.length == endArray.length &&
    endArray.length == textArray.length;
  if (!isOk) return null;

  const subtitles: any = [];
  for (let i = 0; i < textArray.length; i++) {
    subtitles.push({
      [hookConfig.startKey!]: startArray[i],
      [hookConfig.endKey!]: endArray[i],
      [hookConfig.textKey!]: textArray[i],
    });
  }
  return subtitles;
}
