import * as backExports from "../../background/exports";
import "../../background";
import "../../common/init";
console.log("background 为实现部分准备的前置", !!backExports);

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// chrome.action.onClicked.addListener(async (tab) => {
//   (globalThis as any).tabId = tab.id;
//   //发消息给content
//   await chrome.tabs.sendMessage(tab.id, { method: "togglePanel" });
// });

browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  (globalThis as any).tabId = tabId;
  await chrome.sidePanel.setOptions({
    tabId,
    path: "panel.html",
    enabled: true,
  });
});

browser.runtime.onInstalled.addListener(() => {
  console.log("onInstalled");
});

browser.runtime.onMessage.addListener(
  function (request, sender, sendResponse: any) {
    const { method, args } = request;
    const methodFunc = (backExports as any)?.[method];
    if (!methodFunc && typeof methodFunc != "function") return;

    if (!method.startsWith("sync")) {
      methodFunc.apply(this, args).then((result: any) => {
        sendResponse(result);
      });
      return true;
    }

    const result = methodFunc.apply(this, args);
    if (result == undefined) return;
    sendResponse(result);
  },
);
