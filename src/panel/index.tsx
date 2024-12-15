import React from "react";
import { createRoot } from "react-dom/client";
import "../i18n";
import "../common/init";
import { openTab } from "../background/exports";
import { Col, Row } from "antd/es/grid";
import { useTranslation } from "react-i18next";
import styles from "./index.module.css";
import Layout from "antd/es/layout";
import Space from "antd/es/space";
import Subtitles from "./subtitles";
import { useOpenPanelArgs, useRuleUpdate } from "./hooks";
import VideoCameraOutlined from "@ant-design/icons/lib/icons/VideoCameraOutlined";
import SettingOutlined from "@ant-design/icons/lib/icons/SettingOutlined";
import * as panelExports from "./exports";
console.log(!!panelExports);

export default function Panel({ className }: { className?: string }) {
  const [t] = useTranslation();
  const openPanelArgsRef = useOpenPanelArgs();
  useRuleUpdate();
  return (
    <Layout
      className={`${styles["panel-content"]} ${className}`}
    >
      <Header className={styles["header"]} />
      <Subtitles
        activeCrawlSub={openPanelArgsRef.current?.activeCrawlSub}
        activeApplySub={openPanelArgsRef.current?.activeApplySub}
        captionsArg={openPanelArgsRef.current?.captions}
      />
    </Layout>
  );
}

function Header({ className }: { className: string }) {
  const [t] = useTranslation();
  return (
    <Row className={className}>
      <Col flex={2}>
        <Space
          onClick={() => openTab("dash.html")}
          style={{ cursor: "pointer" }}
        >
          <SettingOutlined />
          {t("setting")}
          <Space />
        </Space>
      </Col>
      <Col flex={2}>
        <Space
          onClick={() => openTab("dash.html#video")}
          style={{ cursor: "pointer" }}
        >
          <VideoCameraOutlined />
          {t("video")}
          <Space />
        </Space>
      </Col>
      <Col flex={"auto"}></Col>
      <Col>
        {process.env.VERSION}
      </Col>
    </Row>
  );
}

function mainRender() {
  document.body.innerHTML = '<div id="app"></div>';
  const root = createRoot(document.getElementById("app") as HTMLElement);
  root.render(<Panel />);
}

mainRender();
