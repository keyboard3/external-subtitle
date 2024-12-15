import { APP_NAME } from "./const";

export function createCSSLink(resource: string) {
  const linkEl = document.createElement("link");
  linkEl.setAttribute("rel", "stylesheet");
  linkEl.id = `${APP_NAME}_${resource.replace(".css", "").replace("/", "_")}`;
  linkEl.setAttribute("href", browser.runtime.getURL(resource));
  return linkEl;
}

export function createJavaScript(resource: string) {
  const scriptEl = document.createElement("script");
  scriptEl.id = `${APP_NAME}_${resource.replace(".js", "").replace("/", "_")}`;
  scriptEl.setAttribute("src", browser.runtime.getURL(resource));
  return scriptEl;
}
