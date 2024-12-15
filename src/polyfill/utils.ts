import fs from "fs";
import path from "path";

export function getExportMethodNames(filename: string) {
  const fileCode = fs.readFileSync(
    path.resolve(__dirname, filename),
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
