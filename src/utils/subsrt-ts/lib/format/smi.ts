import { buildHandler } from "../handler";
import { Caption, ContentCaption, MetaCaption } from "../types/handler";

import { SMIBuildOptions, SMIParseOptions } from "./types/smi";

const FORMAT_NAME = "smi";

const helper = {
  htmlEncode: (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      //.replace(/\s/g, '&nbsp;')
      .replace(/\r?\n/g, "<BR>"),
  htmlDecode: (html: string, eol: string) =>
    html
      .replace(/<BR\s*\/?>/gi, eol || "\r\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"),
};

/**
 * Parses captions in SAMI format (.smi).
 */
const parse = (content: string, options: SMIParseOptions) => {
  if (options.format && options.format !== FORMAT_NAME) {
    throw new Error(`Invalid format: ${options.format}`);
  }

  const captions = [];
  const eol = options.eol || "\r\n";

  const title = /<TITLE[^>]*>([\s\S]*)<\/TITLE>/i.exec(content);
  if (title) {
    const caption = <MetaCaption> {};
    caption.type = "meta";
    caption.name = "title";
    caption.data = title[1].replace(/^\s*/g, "").replace(/\s*$/g, "");
    captions.push(caption);
  }

  const style = /<STYLE[^>]*>([\s\S]*)<\/STYLE>/i.exec(content);
  if (style) {
    const caption = <MetaCaption> {};
    caption.type = "meta";
    caption.name = "style";
    caption.data = style[1];
    captions.push(caption);
  }

  const sami = content
    .replace(/^[\s\S]*<BODY[^>]*>/gi, "") // Remove content before body
    .replace(/<\/BODY[^>]*>[\s\S]*$/gi, ""); // Remove content after body

  let prev = null;
  const parts = sami.split(/<SYNC/gi);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i] || parts[i].trim().length === 0) {
      continue;
    }

    const part = `<SYNC${parts[i]}`;

    // <SYNC Start = 1000>
    const match = /^<SYNC[^>]+Start\s*=\s*["']?(\d+)[^\d>]*>([\s\S]*)/i.exec(
      part,
    );
    if (match) {
      const caption = <ContentCaption> {};
      caption.type = "caption";
      caption.start = parseInt(match[1]);
      caption.end = caption.start + 2000;
      caption.duration = caption.end - caption.start;
      caption.content = match[2].replace(/^<\/SYNC[^>]*>/gi, "");

      let blank = true;
      const p =
        /^<P.+Class\s*=\s*["']?([\w-]+)(?: .*)?>([\s\S]*)/i.exec(
          caption.content,
        ) || /^<P([^>]*)>([\s\S]*)/i.exec(caption.content);
      if (p) {
        let html = p[2].replace(/<P[\s\S]+$/gi, ""); // Remove string after another <P> tag
        html = html
          .replace(/<BR\s*\/?>\s+/gi, eol)
          .replace(/<BR\s*\/?>/gi, eol)
          .replace(/<[^>]+>/g, ""); // Remove all tags
        html = html.replace(/^\s+/g, "").replace(/\s+$/g, ""); // Trim new lines and spaces
        blank = html.replace(/&nbsp;/gi, " ").replace(/\s+/g, "").length === 0;
        caption.text = helper.htmlDecode(html, eol);
      }

      if (!options.preserveSpaces && blank) {
        if (options.verbose) {
          console.log(`INFO: Skipping white space caption at ${caption.start}`);
        }
      } else {
        captions.push(caption);
      }

      // Update previous
      if (prev) {
        prev.end = caption.start;
        prev.duration = prev.end - prev.start;
      }
      prev = caption;
      continue;
    }

    if (options.verbose) {
      console.log("WARN: Unknown part", parts[i]);
    }
  }

  return captions;
};

/**
 * Builds captions in SAMI format (.smi).
 */
const build = (captions: Caption[], options: SMIBuildOptions) => {
  const eol = options.eol || "\r\n";

  let content = "";
  content += `<SAMI>${eol}`;
  content += `<HEAD>${eol}`;
  content += `<TITLE>${options.title || ""}</TITLE>${eol}`;
  content += `<STYLE TYPE="text/css">${eol}`;
  content += `<!--${eol}`;
  content +=
    `P { font-family: Arial; font-weight: normal; color: white; background-color: black; text-align: center; }${eol}`;
  content += `.LANG { Name: ${options.langName || "English"}; lang: ${
    options.langCode || "en-US"
  }; SAMIType: CC; }${eol}`;
  content += `-->${eol}`;
  content += `</STYLE>${eol}`;
  content += `</HEAD>${eol}`;
  content += `<BODY>${eol}`;

  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    if (caption.type === "meta") {
      continue;
    }

    if (!caption.type || caption.type === "caption") {
      // Start of caption
      content += `<SYNC Start=${caption.start}>${eol}`;
      content += `  <P Class=LANG>${helper.htmlEncode(caption.text || "")}${
        options.closeTags ? "</P>" : ""
      }${eol}`;
      if (options.closeTags) {
        content += `</SYNC>${eol}`;
      }

      // Blank line indicates the end of caption
      content += `<SYNC Start=${caption.end}>${eol}`;
      content += "  <P Class=LANG>" +
        `&nbsp;${options.closeTags ? "</P>" : ""}${eol}`;
      if (options.closeTags) {
        content += `</SYNC>${eol}`;
      }

      continue;
    }

    if (options.verbose) {
      console.log("SKIP:", caption);
    }
  }

  content += `</BODY>${eol}`;
  content += `</SAMI>${eol}`;

  return content;
};

/**
 * Detects a subtitle format from the content.
 */
const detect = (content: string) => {
  /*
    <SAMI>
    <BODY>
    <SYNC Start=...
    ...
    </BODY>
    </SAMI>
    */
  return /<SAMI[^>]*>[\s\S]*<BODY[^>]*>/.test(content);
};

export default buildHandler({
  name: FORMAT_NAME,
  build,
  detect,
  helper,
  parse,
});
export { build, detect, FORMAT_NAME as name, helper, parse };
