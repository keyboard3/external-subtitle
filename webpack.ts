const rspack = require("@rspack/core");
import { RspackDevServer } from "@rspack/dev-server";
import { getExtensionConfigs } from "./package/webpack.config";
import {
  getPreCompileUSConfig,
  getUserScriptConfigs,
} from "./package/webpack.us.config";
import "dotenv/config";

const isBuild = process.argv.includes("--build");

const chromeExtensionConfigs = getExtensionConfigs("chrome");
const firefoxExtensionConfigs = getExtensionConfigs("firefox");
const usPreConfig = getPreCompileUSConfig();
const userScriptConfigs = getUserScriptConfigs();

const compiler = rspack([
  ...chromeExtensionConfigs,
  ...firefoxExtensionConfigs,
  ...usPreConfig,
]);

// const usCompiler = rspack(userScriptConfigs);
if (isBuild) {
  compiler.run((err: any, stats: any) => {
    if (err) {
      console.error(err);
      return;
    }
    // usCompiler.run((err: any, stats: any) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    //   console.log("changed");
    // });
  });
} else {
  const dashConfig = chromeExtensionConfigs.find((config: any) =>
    !!config.entry["dash"]
  );
  if (dashConfig.devServer) {
    const devServerCompiler = rspack(dashConfig);
    const server = new RspackDevServer(
      { ...dashConfig.devServer },
      devServerCompiler,
    );
    server.startCallback(() => {
      console.log(
        "Starting server on http://localhost:" + dashConfig.devServer.port,
      );
    });
  }

  compiler.watch(
    {
      aggregateTimeout: 300,
      poll: undefined,
    },
    (err: any, stats: any) => {
      if (err) {
        console.error(err);
        return;
      }
      // usCompiler.run((err: any, stats: any) => {
      //   if (err) {
      //     console.error(err);
      //     return;
      //   }
      //   console.log("changed");
      // });
    },
  );
}
