import * as contentExports from "../../content/exports";
import "../../common/init";
import "../../content";
import { delay } from "../../utils/time";

console.log("content 为实现部分准备的前置", !!contentExports);

document.addEventListener("DOMContentLoaded", async () => {
  const config = await contentExports.getConfig();
  if (!config.enable) {
    console.log("未启用 不注入inject.js");
    return;
  }
  injectHook();
});

function injectHook() {
  console.log("injectHook");
  const script = document.createElement("script");
  script.src = browser.runtime.getURL("scripts/inject.js");
  document.head.appendChild(script);
}

const docListener = async (event: CustomEvent) => {
  const { method, id, args } = typeof event.detail == "string"
    ? JSON.parse(event.detail)
    : event.detail;
  const methodFunc = (contentExports as any)?.[method];
  if (!methodFunc && typeof methodFunc != "function") return;
  const result = await methodFunc.apply(this, args);
  if (result == undefined) return;
  const data = { id, method, response: result };
  document.dispatchEvent(
    new CustomEvent("external-subtitle-doc-response", {
      detail: process.env.PLATFORM == "firefox" ? JSON.stringify(data) : data,
    }),
  );
};
document.addEventListener("external-subtitle-doc", docListener);

browser.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (window.top != window) return;
    
    const { method, args } = request;
    const methodFunc = (contentExports as any)?.[method];
    if (!methodFunc && typeof methodFunc != "function") return;

    if (!method.startsWith("sync")) {
      methodFunc.apply(this, args).then(async (result: any) => {
        if (window !== window.top) {
          await delay(100);
        }

        if (result == undefined) return;
        sendResponse(result);
      });
      return true;
    }

    const result = methodFunc.apply(this, args);
    if (result == undefined) return;
    sendResponse(result);
  },
);
