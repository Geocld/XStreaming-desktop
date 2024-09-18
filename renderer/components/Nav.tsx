import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from "@nextui-org/react";

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
  },
  {
    name: "stream",
    href: "/stream/123",
  },
];

const Nav = ({ current, isLogined }) => {
  return (
    <Navbar isBordered style={{ justifyContent: "flex-start" }}>
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
