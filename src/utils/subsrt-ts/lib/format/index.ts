import { SubsrtFormats } from "../types/subsrt";

import ass from "./ass";
import json from "./json";
import lrc from "./lrc";
import sbv from "./sbv";
import smi from "./smi";
import srt from "./srt";
import ssa from "./ssa";
import sub from "./sub";
import vtt from "./vtt";

const formats = <SubsrtFormats> {
  vtt,
  lrc,
  smi,
  ssa,
  ass,
  sub,
  srt,
  sbv,
  json,
};

export default formats;
