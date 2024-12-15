import { fetchInDoc } from "../../document/exports";

export async function fetchRunBackground(
  input: string | URL | globalThis.Request,
  { body, headers, method, signal }: RequestInit = {},
): Promise<Response> {
  const xmlHttpRequest = GM_xmlhttpRequest ||
    (GM.xmlHttpRequest as unknown as typeof GM_xmlhttpRequest);
  const isSupportStreaming =
    (xmlHttpRequest as any)?.RESPONSE_TYPE_STREAM === "stream" ? true : false;

  let url = "";
  if (typeof input === "string") url = input;
  else if (input instanceof URL) url = input.href;
  else if (input instanceof globalThis.Request) url = input.url;

  return new Promise((resolve) => {
    const handle = xmlHttpRequest({
      url,
      data: body as string,
      headers: headers as any,
      method: method as any,
      responseType: (isSupportStreaming ? "stream" : "text") as any,
      onreadystatechange: async (r) => {
        Object.assign(r, { status: r.status });
        if (isSupportStreaming) {
          if (r.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
            resolve({
              ...r,
              body: r.response,
              json: async () => JSON.parse(await getStreamText(r.response)),
              text: async () => await getStreamText(r.response),
            } as any as Response);
          }
        } else {
          if (r.readyState === XMLHttpRequest.DONE) {
            resolve({
              ...r,
              body: new ReadableStream({
                start(controller) {
                  const str = new TextEncoder().encode(r.response);
                  controller.enqueue(str);
                },
              }),
              text: () => r.response,
              json: () => JSON.parse(r.response),
            } as any as Response);
          }
        }
      },
    });
    signal?.addEventListener("abort", () => {
      handle?.abort();
    });
  });
}

async function getStreamText(stream: any) {
  const reader = stream.getReader();
  const { value } = await reader.read();
  const str = new TextDecoder().decode(value);
  reader.releaseLock();
  return str;
}

export async function fetchRunDoc(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
): Promise<Response> {
  let result = await fetchInDoc(input, init);
  const { arrayBuffer, options } = typeof result == "string"
    ? JSON.parse(result)
    : result;
  const headers = new Headers();
  for (let key in options.headers) {
    headers.set(key, options.headers[key]);
  }
  return new Response(new Uint8Array(arrayBuffer), {
    ...options,
    headers,
  });
}
