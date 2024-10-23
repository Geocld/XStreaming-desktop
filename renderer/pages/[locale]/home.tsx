import { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Chip,
} from "@nextui-org/react";
import { useTheme } from "next-themes";
import { useTranslation } from "next-i18next";
import { useRouter } from 'next/router';
import Layout from "../../components/Layout";
import AuthModal from "../../components/AuthModal";
import Ipc from "../../lib/ipc";
import Loading from "../../components/Loading";
import Nav from "../../components/Nav";

import Image from "next/image";

import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

const FOCUS_ELEMS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function Home() {
  const { t, i18n: {language: locale} } = useTranslation('home');

  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [isLogined, setIsLogined] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [consoles, setConsoles] = useState([]);

  const authInterval = useRef(null);

  const currentIndex = useRef(0);
  const focusable = useRef<any>([]);

  useEffect(() => {
    const localTheme = localStorage.getItem('theme');
    console.log('localTheme:', localTheme)
    if (localTheme === 'xbox-light') {
      setTheme(localTheme)
    }
    setLoading(true);
    setLoadingText(t("Loading..."));

    focusable.current = document.querySelectorAll(FOCUS_ELEMS);

    function nextItem(index) {
      index++;
      currentIndex.current = index % focusable.current.length;
      const elem = focusable.current[currentIndex.current];
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        charCode: 9,
        view: window,
        bubbles: true
      });

      document.dispatchEvent(keyboardEvent);
      elem.focus();
    }

    function prevItem(index) {
      if (index === 0) {
        currentIndex.current = focusable.current.length - 1
      } else {
        index -= 1;
        currentIndex.current = index % focusable.current.length;
      }
      
      const elem = focusable.current[currentIndex.current];
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        charCode: 9,
        view: window,
        bubbles: true,
        shiftKey: true
      });
      document.dispatchEvent(keyboardEvent);
      elem && elem.focus();
    }

    function clickItem() {
      setTimeout(() => {
        const elem = focusable.current[currentIndex.current];
        elem && elem.blur();
        elem && elem.click();
      }, 300);
    }

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      let _gamepad = null
      gamepads.forEach(gp => {
        if (gp) _gamepad = gp
      })
      if (_gamepad) {
        _gamepad.buttons.forEach((b, idx) => {
          if (b.pressed) {
            if (idx === 0) {
              clickItem();
            } else if (idx === 12) {
              prevItem(currentIndex.current);
            } else if (idx === 13) {
              nextItem(currentIndex.current);
            } else if (idx === 14) {
              prevItem(currentIndex.current);
            } else if (idx === 15) {
              nextItem(currentIndex.current);
            }
          }
        })
      }
    }

    const timer = setInterval(pollGamepads, 100);

    const _isLogined = window.sessionStorage.getItem("isLogined") || "0";
    if (_isLogined === "1") {
      setIsLogined(true);
    }

    if (_isLogined === "1") {
      // Get Consoles
      setLoadingText(t("Fetching consoles..."));
      Ipc.send("consoles", "get").then((res) => {
        console.log("consoles:", res);
        setConsoles(res);
        setLoading(false);

        setTimeout(() => {
          focusable.current = document.querySelectorAll(FOCUS_ELEMS);
        },  1000);
      });
    } else {
      Ipc.send("app", "checkAuthentication").then((isLogin) => {
        if (isLogin) {
          // Silence login, refresh token
          console.log("Silence login, refresh token");
          authInterval.current = setInterval(() => {
            console.log("Requesting AuthState...");
  
            Ipc.send("app", "getAuthState").then((args) => {
              console.log("Received AuthState:", args);
  
              if (args.isAuthenticating === true) {
                setLoading(true);
              } else if (
                args.isAuthenticated === true &&
                args.user.signedIn === true
              ) {
                clearInterval(authInterval.current);
                window.sessionStorage.setItem("isLogined", "1");
                setIsLogined(true);
  
                // Get Consoles
                setLoadingText(t("Fetching consoles..."));
                Ipc.send("consoles", "get").then((res) => {
                  console.log("consoles:", res);
                  setConsoles(res);
                  setLoading(false);

                  setTimeout(() => {
                    focusable.current = document.querySelectorAll(FOCUS_ELEMS);
                  },  1000);
                  
                });
              }
            });
          }, 500);
        } else {
          console.log("Full auth flow");
          setLoading(false);
          setShowLoginModal(true);
        }
      });
    }
    

    return () => {
      if (authInterval.current) clearInterval(authInterval.current);
      timer && clearInterval(timer);
    };
  }, [t, setTheme]);

  const handleLogin = () => {
    setLoading(true);
    setLoadingText(t("Loading..."));
    Ipc.send("app", "login").then(() => {
      setShowLoginModal(false);
      // Check login state
      authInterval.current = setInterval(() => {
        console.log("Requesting AuthState...");
        Ipc.send("app", "getAuthState").then((args) => {
          console.log("Received AuthState:", args);

          if (args.isAuthenticating === true) {
            setLoading(true);
          } else if (
            args.isAuthenticated === true &&
            args.user.signedIn === true
          ) {
            clearInterval(authInterval.current);
            setIsLogined(true);
            window.sessionStorage.setItem("isLogined", "1");
            setLoading(false);

            // Get Consoles
            setLoadingText(t("Fetching consoles..."));
            Ipc.send("consoles", "get").then((res) => {
              setConsoles(res);

              setTimeout(() => {
                focusable.current = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
              },  1000);
            });
          }
        });
      }, 500);
    });
  };

  const startSession = (sessionId) => {
    console.log("sessionId:", sessionId);
    router.push({
      pathname: `/${locale}/stream`,
      query: { serverid: sessionId }
    });
  };

  return (
    <>
      <Nav current={t("Consoles")} isLogined={isLogined} />

      {loading && <Loading loadingText={loadingText} />}

      <AuthModal show={showLoginModal} onConfirm={handleLogin} />

      <Layout>
        <div className="gap-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
          {consoles.map((console) => {
            return (
              <Card key={console.id}>
                <CardBody>
                  <p className="pb-3 text-center">{console.name}</p>
                  <div className="flex justify-center items-center">
                    <Image
                      src={theme === 'xbox-light' ? '/images/xss-light.svg' : '/images/xss.svg'}
                      alt="xss"
                      width={100}
                      height={100}
                    />
                  </div>
                  <div className="flex justify-center py-2">
                    {console.powerState === "On" ? (
                      <Chip size="sm" radius="none" color="success">
                        {t("Powered on")}
                      </Chip>
                    ) : console.powerState === "ConnectedStandby" ? (
                      <Chip size="sm" radius="none" color="warning">
                        {t("Standby")}
                      </Chip>
                    ) : (
                      <Chip size="sm" radius="none">{console.powerState}</Chip>
                    )}
                  </div>
                </CardBody>
                <Divider />
                <CardFooter>
                  <Button
                    color="primary"
                    fullWidth
                    onClick={() => startSession(console.id)}
                  >
                    {t('Start stream')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </Layout>
    </>
  );
}

export default Home;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "home"]);

// eslint-disable-next-line react-refresh/only-export-components
export {getStaticPaths};
