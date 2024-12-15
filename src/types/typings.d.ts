// typings.d.ts
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

//声明全局变量 browser
declare const browser: typeof chrome;

declare type ExtensionPlatform = "chrome" | "firefox";
