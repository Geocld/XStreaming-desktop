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
import { useSettings } from "../context/userContext"

import Ipc from "../lib/ipc";
import Layout from "../components/Layout"
import SettingItem from "../components/SettingItem"
import Alert from "../components/Alert"
import settings from '../common/settings'
import Nav from "../components/Nav"

function Settings() {
  const { t } = useTranslation()
  const { resetSettings } = useSettings()

  const [showAlert, setShowAlert ] = useState(false)
  const [alertMessage, setAlertMessage ] = useState('')
  const [isLogined, setIsLogined] = useState(false)

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
                <div className="setting-title">{t('Reset Settings')}</div>
                <div className="setting-description">{t('Reset XStreaming settings to default')}</div>

                <Button color="success" onClick={handleResetSettings}>
                  Reset
                </Button>  
              </CardBody>
            </Card>

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
