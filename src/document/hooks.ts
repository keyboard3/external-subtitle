const originFetch = window.fetch;

export function hookXhr(filter: (request: XMLHttpRequest) => Promise<void>) {
  const xhrSend = XMLHttpRequest.prototype.send;
  const proxyXhrSend = async function (this: XMLHttpRequest) {
    if (((this as any).__sentry_xhr__)) {
      await filter((this as any).__sentry_xhr__);
    } else {
      await filter(this);
    }
    // @ts-ignore: it's ok
    return xhrSend.apply(this, arguments);
  };
  Object.defineProperty(XMLHttpRequest.prototype, "send", {
    value: proxyXhrSend,
    writable: true,
  });
}

export function listenXhrRes(
  filterConfigs: {
    filter: (url: string) => boolean;
    onResponse: (res: any, url: string) => void;
  }[],
) {
  const xhrOpen = XMLHttpRequest.prototype.open;
  // console.log("ext-subtitles xhrOpen", xhrOpen);
  XMLHttpRequest.prototype.open = function (_, url: string) {
    // console.log("ext-subtitles xhrOpen", url);
    const filterConfig = filterConfigs.find((config) => config.filter(url));
    if (filterConfig) {
      const xhrSend = this.send;
      // console.log("ext-subtitles xhrSend", xhrSend);
      this.send = function () {
        // console.log("ext-subtitles xhrSend", this);
        const xhrOnLoad = this.onload;
        this.onload = function () {
          const { responseText } = this;
          // console.log("ext-subtitles onload", responseText);
          if (responseText) {
            try {
              // console.log("ext-subtitles responseText", responseText);
              const res = JSON.parse(responseText);
              filterConfig.onResponse(res, url);
            } catch (e) {
              console.log(e);
            }
          }
          //@ts-ignore
          return xhrOnLoad?.apply(this, arguments);
        };
        //@ts-ignore
        return xhrSend.apply(this, arguments);
      };
    }
    //@ts-ignore
    return xhrOpen.apply(this, arguments);
  };
}

export function hookFetch(
  filter: (
    input: RequestInfo,
    init?: RequestInit,
  ) => Promise<Response | undefined>,
) {
  (window as any).originFetch = originFetch;
  window.fetch = async function (input: RequestInfo, init?: RequestInit) {
    let newInput: RequestInfo = input;
    if (input instanceof Request) {
      newInput = input;
    }
    const res = await filter(newInput, init);
    if (!res) {
      return originFetch.apply(this, [input, init]);
    }
    return res;
  };
}
