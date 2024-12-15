import FloatButton from "antd/es/float-button/FloatButton";
import React, { useMemo } from "react";
import { renderComponent } from "../common/render";
import ConfigProvider from "antd/es/config-provider";
import { StyleProvider } from "@ant-design/cssinjs";
import Panel from ".";
import { useConfig } from "../common/hooks";
import { useFloatingBall } from "./floatball-hook";
import styles from "./index.module.css";
import { isMainFrame } from "../utils";
import { useTogglePanel } from "./hooks";

function FloatingBall({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  const { handleToggle, visiblePanel } = useTogglePanel();

  const [config, setConfig] = useConfig();
  const { ballRef, handleMouseDown } = useFloatingBall({
    setConfig,
    onClick: handleToggle,
  });

  let flatRight = useMemo(() => {
    const right = config?.floatBall?.right.replace("px", "");
    if (visiblePanel) {
      return Number(right) + 280 + "px";
    }
    return right + "px";
  }, [config, visiblePanel]);

  const visibleFloatBall = useMemo(() => {
    if (process.env.PLATFORM != "userscript") return false;
    if (!config?.floatBall?.enable) return false;
    return true;
  }, [config]);
  return (
    <StyleProvider container={shadowRoot}>
      <ConfigProvider
        theme={{
          cssVar: true,
          hashed: false,
          components: {
            Tooltip: {
              colorBgSpotlight: "white",
              colorTextLightSolid: "rgba(0, 0, 0, 0.88)",
            },
          },
        }}
        getTargetContainer={() => shadowRoot.querySelector("body")}
        getPopupContainer={() => shadowRoot.querySelector("body")}
      >
        <div hidden={!visibleFloatBall}>
          <FloatButton
            ref={ballRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            style={{
              top: config?.floatBall?.top,
              right: flatRight,
            }}
          />
        </div>
        <div hidden={!visiblePanel}>
          <Panel className={styles.panel} />
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default function renderFloatBall() {
  if (!isMainFrame()) return;

  renderComponent(
    {
      FloatingBall,
    },
    {
      selector: "body",
      type: "insertAfter",
      compName: "FloatingBall",
      useShadowRoot: true,
      props: {},
    },
  );
}
