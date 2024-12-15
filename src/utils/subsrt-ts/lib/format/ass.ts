import { buildHandler } from "../handler";

const FORMAT_NAME = "ass";

// Compatible format
import { build, detect, helper, parse } from "./ssa";

export default buildHandler({
  name: FORMAT_NAME,
  build,
  detect,
  helper,
  parse,
});
export { build, detect, FORMAT_NAME as name, helper, parse };
