const apiUrl = "https://translate.googleapis.com/translate_a/single";

export const rateOption: RateOption = {
  rpm: 60 * 5,
  series: 5,
  group: 1,
  timeout:10000
};

export async function translateListByGoogle(
  text: string[],
  from: string,
  to: string,
  timeout: number = 20000,
): Promise<string[]> {
  return await Promise.all(text.map((item) => {
    return translateByGoogle(item, from, to, timeout);
  }));
}

export async function translateByGoogle(
  text: string,
  from: string,
  to: string,
  timeout: number = 20000,
) {
  try {
    const params = new URLSearchParams({
      client: "gtx",
      dt: "t",
      sl: from,
      tl: to,
      q: text,
    });
    const url = apiUrl + `?` + params.toString();

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(id);

    const data = await res.json() as any;
    return data[0][0][0];
  } catch (err) {
    console.error(err);
    return "";
  }
}
