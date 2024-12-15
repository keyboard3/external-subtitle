import { deserialize, getExportMethodNames, serialize } from "./util";

export function getHookContentToBackExports(platform: ExtensionPlatform) {
  const methodNames = getExportMethodNames("../../background/exports");

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

export function getHookContentToDocExports(platform: ExtensionPlatform) {
  const methodNames = getExportMethodNames("../../document/exports");
  const methodCodes = methodNames.map((key) => {
    return `export async function ${key}(...args:any[]) {
       const mid = Math.random().toString(36).slice(2);
       document.dispatchEvent(new CustomEvent("external-subtitle-content", {detail: ${
      serialize(platform, `{method: "${key}",id:mid, args}`)
    }}));
       const response = await new Promise((resolve) => {
            const listener = (event: CustomEvent) => {
                const {method,id,response} = ${
      deserialize(platform, "event.detail")
    } || {};
                if (method === "${key}" && id == mid) {
                    document.removeEventListener("external-subtitle-content-response", listener);
                    resolve(response);
                }
            };
            document.addEventListener("external-subtitle-content-response", listener);
        });
       return response;
      }`;
  });

  const content = methodCodes.join("\n");
  return content;
}
//废弃
export function getImplDocToContentExports(platform: ExtensionPlatform) {
  const methodNames = getExportMethodNames("../../content/exports");
  const methodCodes = methodNames.map((key) => {
    return `if(method === "${key}") {
      const result = await contentExports.${key}.apply(this,args);
      document.dispatchEvent(new CustomEvent("external-subtitle-doc-response", {detail: ${
      serialize(platform, `{method: "${key}", response: result}`)
    }}));
    }`;
  });

  const content = `
const listener = async (event: CustomEvent) => {
  const {method, args} = ${deserialize(platform, "event.detail")};
  ${methodCodes.join("\n  ")}
};
document.addEventListener("external-subtitle-doc", listener);
  `;
  return content;
}