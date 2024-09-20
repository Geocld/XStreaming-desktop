import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from "@nextui-org/react";
import { useTranslation } from "react-i18next";

const Nav = ({ current, isLogined }) => {

  // const { t } = useTranslation();

  const metas = [
    {
      name: "Consoles",
      href: "/home",
    },
    {
      name: "Xcloud",
      href: "/xcloud",
    },
    {
      name: "Settings",
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
          if (meta.name === "Xcloud" && !isLogined) {
            return null;
          } else {
            return (
              <NavbarItem isActive={current === meta} key={meta.name}>
                <Link
                  color={current === meta.name ? "primary" : "foreground"}
                  href={meta.href}
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
