export default function querySelectorsAll(
  dom: HTMLElement,
  selectors: string[],
) {
  return [...queryElementsBySelectors(dom, selectors)];
}

export function* queryElementsBySelectors(
  dom: HTMLElement,
  selectors: string[],
) {
  for (const selector of selectors) {
    yield* dom.querySelectorAll(selector);
  }
}
