import { useCallback, useEffect, useState } from "react";
import { getConfig, setUserConfig } from "../content/exports";

export function useConfig() {
  const [config, setConfig] = useState<Partial<Config>>({});
  useEffect(() => {
    getConfig().then((config) => {
      setConfig(config);
    });
  }, []);
  const updateUserConfig = useCallback(async (passConfig: Partial<Config>) => {
    await setUserConfig(passConfig);
    const newConfig = await getConfig();
    setConfig(newConfig);
  }, [config]);
  return [config as Config, updateUserConfig] as const;
}

export type HookConfig = ReturnType<typeof useConfig>;
