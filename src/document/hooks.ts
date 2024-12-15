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
  XMLHttpRequest.prototype.open = function (_, url: string) {
    const filterConfig = filterConfigs.find((config) => config.filter(url));
    if (filterConfig) {
      const xhrSend = this.send;
      this.send = function () {
        const xhrStateChange = this.onreadystatechange;
        this.onreadystatechange = function () {
          const {
            readyState,
            responseText,
          } = this;
          if (readyState === XMLHttpRequest.DONE && responseText) {
            try {
              const res = JSON.parse(responseText);
              filterConfig.onResponse(res, url);
            } catch (e) {
              console.log(e);
            }
          }
          //@ts-ignore
          return xhrStateChange?.apply(this, arguments);
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
