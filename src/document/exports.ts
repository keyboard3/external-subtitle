export async function fetchInDoc(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) {
  const docfetch = (window as any).originFetch || fetch;
  return docfetch(input, init).then(async (res: Response) => {
    const { status, statusText, headers } = res;

    const headersObj: any = {};
    for (let [key, value] of headers.entries()) {
      headersObj[key] = value;
    }
    let result = await res.arrayBuffer() as ArrayBuffer;
    const arrayBuffer = Array.from(new Uint8Array(result));
    const response = {
      arrayBuffer,
      options: {
        status,
        statusText,
        headers: headersObj,
      },
    };
    return JSON.stringify(response);
  });
}
