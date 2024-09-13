import React from "react"
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Tabs,
  Tab,
  Select,
  SelectItem
} from "@nextui-org/react"
import { useTranslation } from 'react-i18next'

import Layout from "../components/Layout"
import SettingItem from "../components/SettingItem"
import settings from '../common/settings'

function Settings() {
  const { t } = useTranslation()

  return (
    <>
      <Navbar isBordered>
        <NavbarBrand >
          <p className="font-bold text-inherit">XStreaming</p>
        </NavbarBrand>
        <NavbarContent className="sm:flex gap-10" justify="center">
          <NavbarItem>
            <Link color="foreground" href="/home">
              Consoles
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/xcloud">
              Xcloud
            </Link>
          </NavbarItem>
          <NavbarItem isActive>
            <Link aria-current="page" href="/settings">
              Settings
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="primary" href="#" variant="flat">
              Test
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

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

          <Tab key="Xcloud" title={t('Xcloud')}>
            {
                settings.xcloud.map(item => {
                  return (
                    <SettingItem key={item.name} item={item}/>
                  )
                })
              } 
          </Tab>
        </Tabs>
      </Layout>
    </>
  )
}

export default Settings;
