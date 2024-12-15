import { BuildOptions, ParseOptions } from "../../types/handler";

export interface SMIBuildOptions extends BuildOptions {
  title?: string;
  langName?: string;
  langCode?: string;
  closeTags?: boolean;
}

export interface SMIParseOptions extends ParseOptions {
  preserveSpaces?: boolean;
}
