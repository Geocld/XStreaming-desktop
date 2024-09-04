import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
} from "@nextui-org/react";
import "./Home.css";

function Home() {
  // const { t } = useTranslation()

  return (
    <>
      <Navbar>
        <NavbarBrand>
          <p className="font-bold text-inherit">XStreaming</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="start">
          <NavbarItem isActive>
            <Link href="#">Consoles</Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Xcloud
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Settings
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem className="hidden lg:flex">
            <Link href="#">Login</Link>
          </NavbarItem>
          <NavbarItem>
            <Button as={Link} color="primary" href="#" variant="flat">
              Sign Up
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <div>
        <Card className="max-w-[200px]">
          <CardBody>
            <p>Make beautiful websites regardless of your design experience.</p>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button color="primary" fullWidth>
              Start
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default Home;
