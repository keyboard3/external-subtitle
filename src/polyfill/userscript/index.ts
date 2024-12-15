import "../../common/init";
import "../../background";
import { createJavaScript } from "../../common/resource";
import "../../content";
import * as injectDocumentJs from "../../document/inject";
import * as contentExports from "../../content/exports";
console.log("contentExports 为实现部分准备的前置", !!contentExports);

function injectDocument() {
  const script = createJavaScript(
    `${(injectDocumentJs as any).default.toString()}`,
  );
  document.documentElement.appendChild(script);
  script.remove();
}

injectDocument();
