import { fetchInBackground } from "../../background/exports";
import { fetchInDoc } from "../../document/exports";

export async function fetchRunBackground(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
): Promise<Response> {
  let result = await fetchInBackground(input, init);
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
