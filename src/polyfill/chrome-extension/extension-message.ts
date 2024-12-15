import { deserialize, getExportMethodNames, serialize } from "./util";

export function getHookExtensionToContent(platform: ExtensionPlatform) {
  const methodNames = getExportMethodNames("../../content/exports");
  const methodCodes = methodNames.map((key) => {
    return `export async function ${key}(...args:any[]) {
        let tabId = globalThis.tabId;
        if(!tabId) {
          const tabRes = await browser.tabs.query({active: true, lastFocusedWindow: true});
          tabId = tabRes[0]?.id || tabId;
        }
        
        if(!tabId) {
          const tabRes = await browser.tabs.query({active: true});
          tabId = tabRes[0]?.id || tabId;
        }
        const response = await browser.tabs.sendMessage(tabId, ${
      serialize(platform, `{method: "${key}", args}`)
    });
        return ${deserialize(platform, "response")};
    }`;
  });

  const content = methodCodes.join("\n");
  return content;
}

export function getHookExtensionToPanel(platform: ExtensionPlatform) {
  const methodNames = getExportMethodNames("../../panel/exports");
  const methodCodes = methodNames.map((key) => {
    return `export async function ${key}(...args:any[]) {
      const response = await browser.runtime.sendMessage(${
      serialize(platform, `{method: "${key}", args}`)
    });
      return ${deserialize(platform, "response")};
      }`;
  });

  const content = methodCodes.join("\n");
  return content;
}

export function getImplExtensionToPanel() {
  return `
  browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse: any) {
      const { method, args } = request;
      const methodFunc = (panelExports as any)?.[method];
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
  `;
}
