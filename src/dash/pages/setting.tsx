import React, { useCallback, useState } from "react";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Select from "antd/lib/select";
import Button from "antd/lib/button";
import Switch from "antd/lib/switch";
import { HookConfig, useConfig } from "../../common/hooks";
import { useTranslation } from "react-i18next";
import { i18nResources } from "../../i18n";
import { allTranslationServices } from "../../common/const";
import Alert from "antd/lib/alert";
import { translateServicesConfigs } from "../../background/services";
import { Row, Space } from "antd/lib";
import Flex from "antd/es/flex";
// import debounce from "lodash.debounce";

const formItemLayout = { labelCol: { span: 6 }, wrapperCol: { span: 14 } };
export default function () {
  const context = useConfig();
  return (
    <Form
      {...formItemLayout}
      layout={"horizontal"}
      style={{ maxWidth: 600 }}
    >
      <LngSettingComp context={context} />
      <EnableComp context={context} />
      <TransServiceComp context={context} />
    </Form>
  );
}

function LngSettingComp(
  { context }: { context: HookConfig },
) {
  const [t, i18n] = useTranslation();
  return (
    <Form.Item label={t("lngSetting")}>
      <Select
        key={i18n.language}
        defaultValue={i18n.language}
        popupMatchSelectWidth={false}
        onChange={(value: string) => {
          i18n.changeLanguage(value);
        }}
      >
        {Object.keys(i18nResources).map((lang) => {
          return <Select.Option value={lang}>{t("lng." + lang)}</Select.Option>;
        })}
      </Select>
    </Form.Item>
  );
}

function EnableComp({ context }: { context: HookConfig }) {
  const [t] = useTranslation();
  const [config, setConfig] = context;
  return (
    <Form.Item label={t("enable")}>
      <Switch
        value={config.enable}
        onChange={(e) => {
          setConfig({
            enable: e,
          });
        }}
      />
    </Form.Item>
  );
}

function TransServiceComp({ context }: { context: HookConfig }) {
  const [t] = useTranslation();
  const [config, setConfig] = context;
  const options = allTranslationServices.map((item) => ({
    value: item,
    label: item,
  }));
  const [{ msg, msgType, loading }, setMsgStatus] = useState({
    msg: "",
    msgType: "",
    loading: false,
  });
  const onTest = useCallback(async () => {
    try {
      setMsgStatus({ msg: "", msgType: "", loading: true });
      const serviceConfig = translateServicesConfigs[config.translationService];
      const res = await serviceConfig.translateList(["你好"], "zh", "en");
      if (!res?.length) {
        throw Error("not found res");
      }
      setMsgStatus({
        msg: `success: 你好 -> ${res[0]}`,
        msgType: "success",
        loading: false,
      });
    } catch (err) {
      setMsgStatus({ msg: err.message, msgType: "error", loading: false });
    }
  }, [config.translationService]);
  return (
    <Form.Item label={t("translationService")}>
      <Flex>
        <Select
          key={config.translationService}
          options={options}
          defaultValue={config.translationService}
          onChange={(e) => {
            setConfig({ translationService: e });
          }}
        />
        <Button loading={loading} style={{ marginLeft: 10 }} onClick={onTest}>
          {t("testService")}
        </Button>
      </Flex>
      {msg && (
        <Alert
          message={msg}
          type={msgType as any}
          style={{ marginTop: 10 }}
        />
      )}
    </Form.Item>
  );
}
