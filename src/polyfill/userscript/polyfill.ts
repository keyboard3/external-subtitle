class BrowserStorageSync {
  async get(key: string): Promise<Record<string, any>> {
    const getValue = GM.getValue || GM_getValue;
    const res = await getValue(key, null);
    return {
      [key]: res,
    };
  }

  async set(items: Record<string, any>): Promise<void> {
    const setValue = GM.setValue || GM_setValue;
    Object.entries(items).forEach(async ([key, value]) => {
      value && (await setValue(key, value));
    });
  }
}

class BrowserStorage {
  sync: BrowserStorageSync;
  local: BrowserStorageSync;

  constructor() {
    this.sync = new BrowserStorageSync();
    this.local = new BrowserStorageSync();
  }
}

class BrowserRuntimeOnMessage {
  addListener(
    _callback: (message: any, sender: any, sendResponse: any) => void,
  ): void {}
  removeListener(
    _callback: (message: any, sender: any, sendResponse: any) => void,
  ): void {}
}

class BrowserRuntime {
  onMessage: BrowserRuntimeOnMessage;

  constructor() {
    this.onMessage = new BrowserRuntimeOnMessage();
  }

  sendMessage(_message: any): void {}

  getURL(path: string): string {
    const getResourceUrl = GM_getResourceURL;
    return getResourceUrl(path);
  }
}

class BrowserI18n {
  detectLanguage(
    _text: string,
  ): Promise<{ languages: { language: string; percentage: number }[] }> {
    return new Promise((resolve) => {
      resolve({
        languages: [],
      });
    });
  }
}

class BrowserTabs {
  create(_createProperties: any): void {
    let url = _createProperties.url;
    const openTab = GM.openInTab || GM_openInTab;
    if (!url.startsWith("http")) {
      url = process.env.DASH_URL + url;
    }
    openTab(url);
  }
}

class Browser {
  storage: BrowserStorage;
  runtime: BrowserRuntime;
  i18n: BrowserI18n;
  tabs: BrowserTabs;

  constructor() {
    this.storage = new BrowserStorage();
    this.runtime = new BrowserRuntime();
    this.i18n = new BrowserI18n();
    this.tabs = new BrowserTabs();
  }
}

const userscriptBrowser = new Browser();
export default userscriptBrowser;
