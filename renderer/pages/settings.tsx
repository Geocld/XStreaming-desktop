import React, { useEffect, useState } from "react"
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody
} from "@nextui-org/react"
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useSettings } from "../context/userContext"

import Ipc from "../lib/ipc";
import Layout from "../components/Layout"
import SettingItem from "../components/SettingItem"
import Alert from "../components/Alert"
import settings from '../common/settings'
import Nav from "../components/Nav"
import FeedbackModal from "../components/FeedbackModal";

function Settings() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { resetSettings } = useSettings()

  const [showAlert, setShowAlert ] = useState(false)
  const [alertMessage, setAlertMessage ] = useState('')
  const [isLogined, setIsLogined] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const currentLanguage = i18n.language

  useEffect(() => {
    const _isLogined = window.sessionStorage.getItem('isLogined') || '0'
    if (_isLogined === '1') {
      setIsLogined(true)
    }
  }, [])

  const handleResetSettings = () => {
    window.localStorage.clear()
    resetSettings()
    setTimeout(() => {
      setAlertMessage('Reset Successfully.')
      setShowAlert(true)
    }, 100)
  }

  const handleLouout = () => {
    Ipc.send('app', 'clearData')
  }

  return (
    <>
      <Nav current={'Settings'} isLogined={isLogined}/>

      { showAlert && <Alert content={alertMessage} onClose={() => setShowAlert(false)}/> }

      <FeedbackModal show={showFeedback} onClose={() => setShowFeedback(false)}/>

      <Layout>
        <Tabs aria-label="Options">
          <Tab key="Language" title={t('Language')}>
            {
              settings.language.map(item => {
                return (
                  <SettingItem key={item.name} item={item}/>
                )
              })
            }
          </Tab>

          <Tab key="Streaming" title={t('Streaming')}>
            {
              settings.streaming.map(item => {
                return (
                  <SettingItem key={item.name} item={item}/>
                )
              })
            }
          </Tab>

          <Tab key="Gamepad" title={t('Gamepad')}>
            {
                settings.gamepad.map(item => {
                  return (
                    <SettingItem key={item.name} item={item}/>
                  )
                })
              } 
          </Tab>

          <Tab key="XHome" title={t('Xhome')}>
            {
                settings.xhome.map(item => {
                  return (
                    <SettingItem key={item.name} item={item}/>
                  )
                })
              } 
          </Tab>

          <Tab key="Xcloud" title={t('Xcloud')}>
            {
                settings.xcloud.map(item => {
                  return (
                    <SettingItem key={item.name} item={item}/>
                  )
                })
              } 
          </Tab>

          <Tab key="Others" title={t('Others')}>

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t('Gamepad tester')}</div>
                <div className="setting-description">{t('Test connected gamepad')}</div>

                <Button color="default" onClick={() => {
                  router.push('gamepad/test')
                }}>
                  test
                </Button>  
              </CardBody>
            </Card>

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t('Reset Settings')}</div>
                <div className="setting-description">{t('Reset XStreaming settings to default')}</div>

                <Button color="default" onClick={handleResetSettings}>
                  Reset
                </Button>  
              </CardBody>
            </Card>

            {
              (currentLanguage === 'zh' || currentLanguage === 'zht') && (
                <Card className="setting-item">
                <CardBody>
                  <div className="setting-title">反馈及支持</div>
                  <div className="setting-description">你可以在这里反正使用问题或支持XStreaming的开发</div>

                  <Button color="default" onClick={() => setShowFeedback(true)}>
                    Feedback
                  </Button>  
                </CardBody>
              </Card>
              )
            }

            <Card className="setting-item">
              <CardBody>
                <div className="setting-title">{t('Logout')}</div>
                <div className="setting-description">{t('Logout.')}</div>

                <Button color="danger" onClick={handleLouout}>
                  Logout
                </Button>  
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </Layout>
    </>
  )
}

export default Settings;
