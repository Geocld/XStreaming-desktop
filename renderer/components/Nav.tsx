import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from "@nextui-org/react";
import { useTranslation } from "next-i18next";

const Nav = ({ current, isLogined, locale }) => {

  console.log('isLogined:', isLogined)

  const { t } = useTranslation('common');

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
      name: t("Settings"),
      href: "/settings",
    }
  ];

  return (
    <Navbar isBordered style={{ justifyContent: "flex-start", zIndex: 100 }}>
      <NavbarBrand className="grow-0">
        <p className="font-bold text-inherit pr-20">XStreaming</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="start">
        {metas.map((meta) => {
          if (meta.href === "/xcloud" && !isLogined) {
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
    </Navbar>
  );
};

export default Nav;
