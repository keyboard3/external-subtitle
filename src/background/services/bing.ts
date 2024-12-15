import { StorageKey } from "../../common/const";
import { parseJWT } from "../../utils";
import { getLocalValue, setLocalValue } from "../../utils/storage";

export const rateOption: RateOption = {
  rpm: 60 * 5,
  series: 5,
  group: 10,
  timeout:10000
};

export async function translateListByBing(
  text: string[],
  from: string,
  to: string,
  timeout: number = 20000,
): Promise<string[]> {
  const body = [];
  for (const item of text) {
    body.push({ Text: item });
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const bodyString = JSON.stringify(body);
  const auth = await fetchAccessToken();
  const res = await fetch(
    `https://api-edge.cognitive.microsofttranslator.com/translate?from=${from}&to=${to}&api-version=3.0&includeSentenceLength=true`,
    {
      headers: new Headers({
        "accept": "*/*",
        "accept-language":
          "zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5",
        "authorization": "Bearer " + auth.accessToken,
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "sec-ch-ua":
          '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      }),
      body: bodyString,
      method: "POST",
      signal: controller.signal,
    },
  );
  clearTimeout(id);
  const result = await res.json();
  if (
    result && result.length > 0 && result[0].translations &&
    result[0].translations.length > 0
  ) {
    return result.map((item: any) => item.translations[0]?.text || "");
  }
  return body.map((item) => item.Text);
}

export async function fetchAccessToken() {
  const cacheAuthToken = await getLocalValue(
    StorageKey.bingAuth,
  ) as AccessToken;
  if (cacheAuthToken && Date.now() < cacheAuthToken.accessTokenExpiresAt) {
    return cacheAuthToken;
  }

  const res = await fetch("https://edge.microsoft.com/translate/auth", {
    headers: new Headers({
      "accept": "*/*",
      "accept-language":
        "zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua":
        '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-mesh-client-arch": "x86_64",
      "sec-mesh-client-edge-channel": "beta",
      "sec-mesh-client-edge-version": "113.0.1774.23",
      "sec-mesh-client-os": "Windows",
      "sec-mesh-client-os-version": "10.0.19044",
      "sec-mesh-client-webview": "0",
      "Referer": "https://appsumo.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }),
    method: "GET",
  });
  const result = await res.text();
  const parsedAccessToken = parseJWT(result);
  await setLocalValue(StorageKey.bingAuth, parsedAccessToken);
  return parsedAccessToken;
}
