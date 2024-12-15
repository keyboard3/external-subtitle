export function injectCss({ doc, css, id }: {
  doc: Document | ShadowRoot;
  css: string;
  id?: string;
}) {
  try {
    removeInjectCss(doc, id);
    const style = document.createElement("style");
    style.textContent = css;
    style.id = id;
    if (doc instanceof ShadowRoot || !doc.head?.appendChild) {
      doc.appendChild(style);
    } else {
      doc.head.appendChild(style);
    }
  } catch (error) {
    console.error("inject css error", error);
  }
}

export function removeInjectCss(doc: Document | ShadowRoot, id: string) {
  const style = doc.getElementById(id);
  if (style) style.remove();
}
