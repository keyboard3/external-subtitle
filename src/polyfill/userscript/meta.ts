//读项目的package.json文件
import metaData from "../../../package.json";

export function getUserScriptMeta() {
  return (
    `// ==UserScript==
// @name         ${metaData.name}
// @description  ${metaData.description}
// @version      ${metaData.version}
// @author       ${metaData.author}
// @match        *://*/*
// @include      *
// @grant       GM_getValue
// @grant       GM.getValue
// @grant       GM_setValue
// @grant       GM.setValue
// @grant       GM_registerMenuCommand
// @grant       GM.registerMenuCommand
// @grant       GM_addElement
// @grant       GM.addElement
// @grant       GM_listValues
// @grant       GM.listValues
// @grant       GM_deleteValue
// @grant       GM.deleteValue
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @grant       GM_addStyle
// @grant       GM.addStyle
// @grant       GM_openInTab
// @grant       GM.openInTab
${getAllDomain().map(item=>`// @connect     ${item}`).join('\n')}
// @run-at       document-end
// ==/UserScript==`
  );
}

// 递归读取src 下面所有的ts 文件 正则提取出http:// https:// 地址的域名
function getAllDomain() {
  const fs = require("fs");
  const path = require("path");
  const filePath = path.resolve(__dirname, "../../");
  let domainList: string[] = [];
  function readDirSync(filePath: string) {
    const pa = fs.readdirSync(filePath);
    pa.forEach(function (ele: string, index: number) {
      var info = fs.statSync(filePath + "/" + ele);
      if (info.isDirectory()) {
        readDirSync(filePath + "/" + ele);
      } else {
        if (ele.indexOf(".ts") > -1) {
          const data = fs.readFileSync(filePath + "/" + ele, "utf-8");
          const reg = /(?:http|https):\/\/(\S*?)\//g;
          let match;
          while ((match = reg.exec(data))) {
            domainList.push(match[1]);
          }
        }
      }
    });
  }
  readDirSync(filePath);
  return domainList;
}
