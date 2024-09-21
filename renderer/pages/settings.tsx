import React, { useEffect, useState } from "react";
import { Button, Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/navigation";
import { useSettings } from "../context/userContext";

import Ipc from "../lib/ipc";
import Layout from "../components/Layout";
import SettingItem from "../components/SettingItem";
import Alert from "../components/Alert";
import getSettingsMetas from "../common/settings";
import Nav from "../components/Nav";
import FeedbackModal from "../components/FeedbackModal";
import ConfirmModal from "../components/ConfirmModal";
import updater from "../lib/updater";
import pkg from '../../package.json';

function Settings() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const { resetSettings } = useSettings();

  const [showAlert, setShowAlert] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLogined, setIsLogined] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [settings, setSettings] = useState<any>({})

  const currentLanguage = i18n.language;

  useEffect(() => {
    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    const _settings = getSettingsMetas(t)
    setSettings(_settings)
  }, [t]);

  const handleResetSettings = () => {
    window.localStorage.clear();
    resetSettings();
    setTimeout(() => {
      setAlertMessage(t("Reset Successfully"));
      setShowAlert(true);
    }, 100);
  };

  const handleCheckUpdate = () => {
    setIsChecking(true)
    updater().then((infos: any) => {
      setIsChecking(false)
      if (infos) {
        const {latestVer, version, url} = infos;
        setUpdateText(`Check new version ${latestVer}, current version is ${version}`);
        setUpdateUrl(url);
        setShowUpdateModal(true);
      } else {
        setAlertMessage(t('Current version is latest!'));
        setShowAlert(true);
      }
    });
  };

  const handleLouout = () => {
    Ipc.send("app", "clearData");
  };

  return (
    <>
      <Nav current={"Settings"} isLogined={isLogined} />

      {showAlert && (
        <Alert content={alertMessage} onClose={() => setShowAlert(false)} />
      )}

      <FeedbackModal
        show={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      <ConfirmModal
        show={showRestartModal}
        content={t('The option has been saved. A restart is required for it to take effect. Would you like to restart now?')}
        confirmText={t('Restart')}
        onConfirm={() => {
          Ipc.send('app', 'restart')
        }}
        onCancel={() => setShowRestartModal(false)}
      />

      <ConfirmModal
        show={showUpdateModal}
        content={updateText}
        onCancel={() => setShowUpdateModal(false)}
        onConfirm={() => {
          window.location.href = updateUrl
          setShowUpdateModal(false)
        }}
      />

      <Layout>
        <Tabs aria-label="Options">
          <Tab key="Language" title={t("Language")}>
            {settings.language && settings.language.map((item) => {
              return <SettingItem key={item.name} item={item} onRestartWarn={() => setShowRestartModal(true)}/>;
            })}
          </Tab>

          <Tab key="Streaming" title={t("Streaming")}>
            {settings.streaming && settings.streaming.map((item) => {
              return <SettingItem key={item.name} item={item} onRestartWarn={() => setShowRestartModal(true)}/>;
            })}
          </Tab>

          <Tab key="Gamepad" title={t("Gamepad")}>
            {settings.gamepad && settings.gamepad.map((item) => {
              return <SettingItem key={item.name} item={item} onRestartWarn={() => setShowRestartModal(true)}/>;
            })}
          </Tab>

          <Tab key="XHome" title={t("Xhome")}>
            {settings.xhome && settings.xhome.map((item) => {
              return <SettingItem key={item.name} item={item} onRestartWarn={() => setShowRestartModal(true)}/>;
            })}
          </Tab>

          <Tab key="Xcloud" title={t("Xcloud")}>
            {settings.xcloud && settings.xcloud.map((item) => {
              return <SettingItem key={item.name} item={item} onRestartWarn={() => setShowRestartModal(true)}/>;
            })}
          </Tab>

          <Tab key="Others" title={t("Others")}>
            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Gamepad tester")}</div>
                <div className="setting-description">
                  {t("Test connected gamepad")}
                </div>

                <Button
                  color="default"
                  onClick={() => {
                    router.push("gamepad/test");
                  }}
                >
                  test
                </Button>
              </CardBody>
            </Card>

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Reset Settings")}</div>
                <div className="setting-description">
                  {t("Reset XStreaming settings to default")}
                </div>

                <Button color="default" onClick={handleResetSettings}>
                  {t('Reset Settings')}
                </Button>
              </CardBody>
            </Card>

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Check update")}</div>
                <div className="setting-description">
                  {t("Check XStreaming update, current version is:")} {pkg.version}
                </div>

                <Button color="default" isLoading={isChecking} onClick={handleCheckUpdate}>
                  {t('Check')}
                </Button>
              </CardBody>
            </Card>

            {(currentLanguage === "zh" || currentLanguage === "zht") && (
              <Card className="setting-item">
                <CardBody>
                  <div className="setting-title">反馈及支持</div>
                  <div className="setting-description">
                    你可以在这里反正使用问题或支持XStreaming的开发
                  </div>

                  <Button color="default" onClick={() => setShowFeedback(true)}>
                    反馈
                  </Button>
                </CardBody>
              </Card>
            )}

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t("Logout")}</div>
                <div className="setting-description">{t("Logout.")}</div>

                <Button color="danger" onClick={handleLouout}>
                  {t('Logout')}
                </Button>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </Layout>
    </>
  );
}

export default Settings;
