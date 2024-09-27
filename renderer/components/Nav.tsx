import { useEffect, useState } from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";

import { useTranslation } from "next-i18next";

import Ipc from "../lib/ipc";

const Nav = ({ current, isLogined }) => {
  console.log("isLogined:", isLogined);

  const { t, i18n: {language: locale} } = useTranslation("common");
  const [userState, setUserState] = useState(null);

  const metas = [
    {
      name: t("Consoles"),
      href: "/home",
    },
    {
      name: t("Xcloud"),
      href: "/xcloud",
    },
    {
      name: t("Achivements"),
      href: "/achivements",
    },
    {
      name: t("Settings"),
      href: "/settings",
    },
    // {
    //   name: 'Stream',
    //   href: "/stream?serverid=123",
    // },
  ];

  useEffect(() => {
    Ipc.send('app', 'getAuthState').then(res => {
      if (isLogined) {
        setUserState(res.user)
      }
    });
  }, [isLogined])

  const handleLouout = () => {
    Ipc.send("app", "clearData");
  }

  const handleToggleScreen = () => {
    Ipc.send("app", "toggleFullscreen")
  }

  return (
    <Navbar isBordered maxWidth="full" style={{ justifyContent: "flex-start", zIndex: 100 }}>
      <NavbarBrand className="grow-0">
        <p className="font-bold text-inherit pr-20">XStreaming</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="start">
        {metas.map((meta) => {
          if ((meta.href === "/xcloud" || meta.href === "/achivements") && !isLogined) {
            return null;
          } else {
            return (
              <NavbarItem isActive={current === meta} key={meta.name}>
                <Link
                  color={current === meta.name ? "primary" : "foreground"}
                  href={`/${locale}${meta.href}`}
                >
                  {meta.name}
                </Link>
              </NavbarItem>
            );
          }
        })}
      </NavbarContent>

      {
        userState && (
          <NavbarContent as="div" justify="end">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="success"
                  name={userState.gamertag}
                  size="sm"
                  src={userState.gamerpic}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="text-lg">{userState.gamertag}</p>
                  <p className="font-semibold">{t('Score')}: {userState.gamerscore}</p>
                </DropdownItem>
                <DropdownItem key="fullscreen" onClick={handleToggleScreen}>{t('Toggle fullscreen')}</DropdownItem>
                <DropdownItem key="logout" color="danger" onClick={handleLouout}>
                {t('Logout')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        )
      }
      
    </Navbar>
  );
};

export default Nav;
