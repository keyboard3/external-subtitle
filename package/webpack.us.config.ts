import path from "path";
import rspack from "@rspack/core";
import { getUserScriptMeta } from "../src/polyfill/userscript/meta";
import metaData from "../package.json";

const isProd = process.env.PROD == "1";

export function getUserScriptConfigs() {
  const contentConfig = userscriptWebpack({
    "external-subtitle.user": "./src/polyfill/userscript/index.ts",
  });
  return [contentConfig];
}

export function getPreCompileUSConfig() {
  return [
    userscriptWebpack({
      "inject": "./src/document/inject.ts",
    }),
  ];
}
function userscriptWebpack(
  entry: Partial<
    { [key in "float" | "external-subtitle.user" | "inject" | "dash"]: string }
  >,
  clean = false,
): any {
  const entryKey = Object.keys(entry)[0];
  const loaderOption = { entry: entryKey, platform: "userscript" };
  let sourceMap = isProd ? undefined : "eval-source-map";
  if (entryKey == "inject" && !isProd) {
    sourceMap = "inline-source-map";
  }

  let outputPath = path.resolve(__dirname, "../dist/userscript");
  return {
    entry,
    devtool: isProd ? undefined : sourceMap,
    mode: isProd ? "production" : "development",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: ["esbuild-loader", {
            loader: path.resolve(__dirname, "loader.ts"),
            options: loaderOption,
          }],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: [
            {
              loader: rspack.CssExtractRspackPlugin.loader,
              options: {
                esModule: true,
              },
            },
            {
              loader: "css-loader",
            },
            "postcss-loader",
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        "react": "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat", // Must be below test-utils
        "react/jsx-runtime": "preact/jsx-runtime",
        "webextension-polyfill": path.resolve(
          __dirname,
          "../src/polyfill/userscript/polyfill.ts",
        ),
      },
    },
    output: {
      clean,
      filename: "[name].js",
      path: outputPath,
    },
    plugins: [
      new rspack.DefinePlugin({
        "process.env.PROD": JSON.stringify(process.env.PROD),
        "process.env.DASH_URL": JSON.stringify(process.env.DASH_URL),
        "process.env.VERSION": JSON.stringify(metaData.version),
        "process.env.PLATFORM": "userscript",
      }),
      entryKey == "inject" ? undefined : new rspack.BannerPlugin({
        banner: getUserScriptMeta(),
        raw: true, // 这是原始文本，不应该被 webpack 处理
        entryOnly: true, // 只在入口 chunk 文件中添加
      }),
      new rspack.CssExtractRspackPlugin({
        filename: "./[name].css",
        chunkFilename: "./[id].css",
      }),
    ],
    optimization: {
      minimize: isProd,
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          minimizerOptions: {
            // format: {
            //   comments: function (node, comment) {
            //     // 保留以 @preserve 或 @license 开头的注释，或者保留你的元数据块
            //     // 例如，检查是否包含特定的标识符，如 ==UserScript==
            //     const isLicense =
            //       /@name|@description|@version|@author|@match|@include|@inject|@grant|@run-at|@connect|@namespace|@homepageURL|@supportURL|@icon|@downloadURL|updateURL/i
            //         .test(comment.value);
            //     const isUserScript = /==\/?UserScript==/igm
            //       .test(comment.value);
            //     return isLicense || isUserScript;
            //   },
            // },
          },
          extractComments: false, // 不将注释提取到单独的文件
        }),
      ],
    },
  };
}
