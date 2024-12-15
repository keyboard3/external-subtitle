import path from "path";
import fs from "fs";

//序列化
export function serialize(platform: ExtensionPlatform, data: string) {
  if (platform == "firefox") return `JSON.stringify(${data})`;
  return data;
}

//反序列化
export function deserialize(platform: ExtensionPlatform, data: string) {
  return `(()=> {
    try {
      return typeof ${data} == "string" ? JSON.parse(${data}) : ${data};
    } catch(e) {
      return ${data};
    }
  })()`;
}

export function getExportMethodNames(filename: string) {
  const fileCode = fs.readFileSync(
    path.resolve(__dirname, filename + ".ts"),
    "utf-8",
  );

  //正则读取出所有 export 语句
  const methods = [];
  const funcRegex = /export async function (\S+?)\(/g;
  let regex = funcRegex.exec(fileCode);
  while (regex) {
    methods.push(regex[1]);
    regex = funcRegex.exec(fileCode);
  }
  return methods;
}