import { APP_NAME } from "./const";

export function createCSSLink(resource: string, id?: string) {
  const styleEl = document.createElement("style");
  styleEl.id = id || `${APP_NAME}_${resource}`;
  styleEl.innerHTML = resource;
  return styleEl;
}

export function createJavaScript(resource: string, id?: string) {
  const scriptEl = document.createElement("script");
  scriptEl.id = id || `${APP_NAME}_${resource}`;
  scriptEl.innerHTML = resource;
  return scriptEl;
}
