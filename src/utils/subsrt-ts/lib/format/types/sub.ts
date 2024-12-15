import { BuildOptions, ParseOptions } from "../../types/handler";

export interface SUBBuildOptions extends BuildOptions {
  fps?: number;
}

export interface SUBParseOptions extends ParseOptions {
  fps?: number;
}
