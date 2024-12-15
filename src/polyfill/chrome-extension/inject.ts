import * as docExports from "../../document/exports";
import "../../document/inject";

console.log("inject", !!docExports);

const docListener = async (event: CustomEvent) => {
  const { method, id, args } = typeof event.detail == "string"
    ? JSON.parse(event.detail)
    : event.detail;
  const methodFunc = (docExports as any)?.[method];
  if (!methodFunc && typeof methodFunc != "function") return;
  const result = await methodFunc.apply(this, args);
  if (result == undefined) return;
  const data = { method, id, response: result };
  document.dispatchEvent(
    new CustomEvent("external-subtitle-content-response", {
      detail: process.env.PLATFORM == "firefox" ? JSON.stringify(data) : data,
    }),
  );
};
document.addEventListener("external-subtitle-content", docListener);
