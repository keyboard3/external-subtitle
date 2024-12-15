import path from "path";
import rspack from "@rspack/core";
import metaData from "../package.json";

const isProd = process.env.PROD == "1";

export function getExtensionConfigs(platform: "chrome" | "firefox") {
  const panelConfig = extensionWebpack(platform, {
    panel: "./src/panel/index.tsx",
  });
  const contentConfig = extensionWebpack(platform, {
    content: "./src/polyfill/chrome-extension/content.ts",
  });
  const backgroundConfig = extensionWebpack(platform, {
    background: "./src/polyfill/chrome-extension/background.ts",
  });
  const injectConfig = extensionWebpack(platform, {
    inject: "./src/polyfill/chrome-extension/inject.ts",
  });
  const dashConfig = extensionWebpack(platform, {
    dash: "./src/dash/index.tsx",
  });
  const videoWorkConfig = extensionWebpack(platform, {
    "video-worker": "./src/dash/pages/video/video-worker.ts",
  });
  return [
    panelConfig,
    contentConfig,
    backgroundConfig,
    injectConfig,
    dashConfig,
    videoWorkConfig,
  ];
}

function extensionWebpack(
  platform: "chrome" | "firefox",
  entry: Partial<
    {
      [
        key in
          | "panel"
          | "content"
          | "background"
          | "inject"
          | "dash"
          | "video-worker"
      ]: string;
    }
  >,
  clean = false,
): any {
  const entryKey = Object.keys(entry)[0];
  const loaderOption = { entry: entryKey, platform };
  let outputPath = path.resolve(__dirname, "../dist/" + platform);

  let devServer = {};
  let alias = {};
  if (!isProd && entryKey == "dash") {
    devServer = {
      static: {
        directory: outputPath,
      },
      compress: true,
      port: 9000,
    };
  }
  if (["dash", "inject"].includes(entryKey)) {
    alias = {
      "webextension-polyfill": path.resolve(
        __dirname,
        "../src/polyfill/userscript/polyfill.ts",
      ),
    };
  }
  return {
    entry,
    devtool: isProd ? undefined : "inline-source-map",
    mode: isProd ? "production" : "development",
    //@ts-ignore
    devServer,
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
        ...alias,
      },
    },
    output: {
      clean,
      filename: "[name].js",
      path: path.resolve(__dirname, `../dist/${platform}/scripts`),
    },
    plugins: [
      new rspack.DefinePlugin({
        "process.env.PROD": JSON.stringify(process.env.PROD),
        "process.env.DASH_URL": JSON.stringify(process.env.DASH_URL),
        "process.env.VERSION": JSON.stringify(metaData.version),
        "process.env.PLATFORM": JSON.stringify(platform),
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {
            from: "./src/assets",
            to: outputPath,
            globOptions: {
              ignore: ["/**/manifest.*/"],
            },
          },
          {
            from: `./src/assets/manifest.${platform}.json`,
            to: path.resolve(
              __dirname,
              "../dist/" + platform + "/manifest.json",
            ),
          },
        ],
      }),
      new rspack.CssExtractRspackPlugin({
        filename: "../css/[name].css",
        chunkFilename: "../css/[id].css",
      }),
    ],
    optimization: {
      minimize: isProd,
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          minimizerOptions: {
            compress: {
              drop_console: isProd,
            },
          },
        }),
      ],
    },
  };
}
