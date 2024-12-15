import { createRoot } from "react-dom/client";
import React from "react";
import { APP_NAME } from "./const";
import { createCSSLink } from "./resource";

export type RenderType =
  | "appendChild"
  | "insertBefore"
  | "insertAfter"
  | "replace";

export function renderComponent(
  Components: any,
  {
    selector,
    type,
    compName,
    style,
    props,
    useShadowRoot = false, // 新增参数，指定是否在 shadowRoot 上渲染
  }: {
    selector: string;
    type: RenderType;
    compName: any;
    style?: string;
    props: any;
    useShadowRoot?: boolean; // 新增参数，指定是否在 shadowRoot 上渲染
  },
) {
  let containerEle = document.querySelector(selector);
  if (!containerEle) {
    console.warn("cant find ele", selector);
    return;
  }

  const containerId = `${APP_NAME}_${compName}`;
  let appEle = containerEle.querySelector(`#${containerId}`);
  if (!appEle) {
    if (type == "replace") {
      appEle = containerEle;
    } else if (type == "appendChild") {
      appEle = document.createElement("div");
      containerEle.appendChild(appEle);
    } else if (type == "insertBefore") {
      appEle = document.createElement("div");
      containerEle.parentElement?.insertBefore(appEle, containerEle);
    } else if (type == "insertAfter") {
      appEle = document.createElement("div");
      if (containerEle.nextSibling) {
        containerEle.parentElement?.insertBefore(
          appEle,
          containerEle.nextSibling,
        );
      } else {
        containerEle.parentElement?.appendChild(appEle);
      }
    }
    appEle.id = containerId;
    appEle.setAttribute("style", style);
  }

  let bodyEle = appEle;
  if (useShadowRoot && !appEle.shadowRoot) {
    appEle.attachShadow({ mode: "open" });
    bodyEle = appEle.shadowRoot.querySelector("body");
    if (!bodyEle) {
      const linkEl = createCSSLink("css/content.css");

      appEle.shadowRoot.appendChild(linkEl);
      bodyEle = document.createElement("body");
      appEle.shadowRoot?.appendChild(bodyEle);
    }
  }

  const root = createRoot(bodyEle);
  root.render(
    React.createElement(Components[compName], {
      ...props,
      shadowRoot: appEle.shadowRoot,
    }),
  );
  return appEle;
}
