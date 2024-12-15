import React from "react";
import { renderComponent, RenderType } from "../../common/render";
import Caption from "./caption";

const Components = {
  Caption,
};

type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

export function renderComp<
  K extends keyof typeof Components,
>(
  data: {
    selector: string;
    type: RenderType;
    compName: K;
    useShadowRoot: boolean;
    style: string;
    props: ComponentProps<typeof Components[K]>;
  },
) {
  return renderComponent(Components, data);
}
