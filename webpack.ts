const rspack = require("@rspack/core");
import { RspackDevServer } from "@rspack/dev-server";
import { getExtensionConfigs } from "./package/webpack.config";
import {
  getPreCompileUSConfig,
  getUserScriptConfigs,
} from "./package/webpack.us.config";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

const isBuild = process.argv.includes("--build");

const chromeExtensionConfigs = getExtensionConfigs("chrome");
const firefoxExtensionConfigs = getExtensionConfigs("firefox");
const usPreConfig = getPreCompileUSConfig();
const userScriptConfigs = getUserScriptConfigs();

// Function to create zip files for browser platforms
const createZipForPlatform = (platform: string) => {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(path.join('dist', `${platform}.zip`));
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      console.log(`${platform}.zip created successfully (${archive.pointer()} total bytes)`);
      resolve();
    });
    
    archive.on('error', (err) => {
      console.error(`Error creating ${platform}.zip:`, err);
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add the platform directory to the zip
    archive.directory(path.join('dist', platform), false);
    
    archive.finalize();
  });
};

const compiler = rspack([
  ...chromeExtensionConfigs,
  ...firefoxExtensionConfigs,
  ...usPreConfig,
]);

// const usCompiler = rspack(userScriptConfigs);
if (isBuild) {
  compiler.run(async (err: any, stats: any) => {
    if (err) {
      console.error(err);
      return;
    }
    
    console.log("Build completed successfully.");
    
    // Create zip files for each platform
    try {
      console.log("Creating zip files for browser platforms...");
      await Promise.all([
        createZipForPlatform('chrome'),
        createZipForPlatform('firefox')
      ]);
      console.log("All zip files created successfully.");
    } catch (zipError) {
      console.error("Error creating zip files:", zipError);
    }
    
    // Uncomment if you need to run the userscript compiler
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
