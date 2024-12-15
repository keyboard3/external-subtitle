import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./error-page";
import Layout, { Content } from "antd/es/layout/layout";
import Menu from "antd/es/menu";
import Sider from "antd/es/layout/Sider";
import theme from "antd/es/theme";
import Setting from "./pages/setting";
import Video from "./pages/video";
import "../i18n";
import { useTranslation } from "react-i18next";
import Divider from "antd/es/divider";
import "./index.css";
if (typeof chrome != "undefined" && chrome.storage) {
  (globalThis as any).browser = chrome;
}

interface CustomRoute {
  name: string;
  comp: React.ComponentType;
}

const defaultRouteName = "setting";
const routes: CustomRoute[] = [
  {
    name: "setting",
    comp: Setting,
  },
  {
    name: "video",
    comp: Video,
  },
];
const defaultRoute = routes.find((item) => item.name === defaultRouteName)!;
const hashRoutes = [
  {
    path: "/",
    name: defaultRouteName,
    element: <defaultRoute.comp />,
    errorElement: <ErrorPage />,
  },
  ...routes.map((route) => ({
    path: `/${route.name}`,
    name: route.name,
    element: <route.comp />,
    errorElement: <ErrorPage />,
  })),
];

const router = createHashRouter(hashRoutes);
const titleRouter = createHashRouter(hashRoutes.map((item) => ({
  ...item,
  element: <Title name={item.name} />,
})));

function App() {
  const [t] = useTranslation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  if (location.href.includes("pure-page")) {
    return <RouterProvider router={router} />;
  }
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} style={{ background: colorBgContainer }}>
        <Divider orientation="center">{process.env.VERSION}</Divider>
        <Menu
          mode="inline"
          defaultSelectedKeys={[defaultRouteName]}
          defaultOpenKeys={[defaultRouteName]}
          style={{ height: "100%", borderRight: 0 }}
          items={routes.map((item: CustomRoute) => {
            return {
              key: item.name,
              label: <a href={`#${item.name}`}>{t(item.name)}</a>,
            };
          })}
        />
      </Sider>
      <Layout style={{ padding: "0 12px 12px", minHeight: "100%" }}>
        <Content
          style={{
            padding: "0 12px 0",
            margin: 0,
            minHeight: "100%",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
          className="bg-red-500"
        >
          <RouterProvider router={titleRouter} />
          <RouterProvider router={router} />
        </Content>
      </Layout>
    </Layout>
  );
}

function Title({ name }: { name: string }) {
  const [t] = useTranslation();
  return <Divider orientation="left">{t(name)}</Divider>;
}

document.body.innerHTML = '<div id="app"></div>';
const root = createRoot(document.getElementById("app") as HTMLElement);
root.render(<App />);

if (chrome.runtime) {
  const script = document.createElement("script");
  script.src = "./scripts/content.js";
  document.body.appendChild(script);
}
