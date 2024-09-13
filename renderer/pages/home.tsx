import { useEffect, useState, useRef } from "react"
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
import { useRouter } from 'next/navigation'
import AuthModal from "../components/AuthModal"
import Ipc from "../lib/ipc";
import Loading from '../components/Loading'

import {useTheme} from "next-themes"

function Home() {

  const { theme, setTheme } = useTheme()

  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('')
  const [loginState, setLoginState] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [consoles, setConsoles] = useState([])

  const authInterval = useRef(null)

  useEffect(() => {
    Ipc.send('app', 'checkAuthentication').then(isLogin => {
      if (isLogin) { // Silence login, refresh token
        console.log('Silence login, refresh token')
        authInterval.current = setInterval(() => {
          console.log('Requesting AuthState...')
          Ipc.send('app', 'getAuthState').then(args => {
              console.log('Received AuthState:', args)
      
              if(args.isAuthenticating === true){
                  setLoading(true)
              } else if(args.isAuthenticated === true && args.user.signedIn === true){
                  clearInterval(authInterval.current)
                  setLoginState(true)
  
                  // Get Consoles
                  Ipc.send('consoles', 'get').then(res => {
                    console.log('consoles:', res)
                    setConsoles(res)
                    setLoading(false)
                  })
              }
          })
        }, 500)
      } else {
        console.log('Full auth flow')
        setShowLoginModal(true)
      }
    })
    
    return () => {
      if(authInterval.current) clearInterval(authInterval.current)
    }
  }, [])

  const handleLogin = () => {
    Ipc.send('app', 'login').then(() => {
      setShowLoginModal(false)
      // Check login state
      authInterval.current = setInterval(() => {
        console.log('Requesting AuthState...')
        Ipc.send('app', 'getAuthState').then(args => {
            console.log('Received AuthState:', args)
    
            if(args.isAuthenticating === true){
                setLoading(true)
            } else if(args.isAuthenticated === true && args.user.signedIn === true){
                clearInterval(authInterval.current)
                setLoginState(true)
                setLoading(false)

                // Get Consoles
                Ipc.send('consoles', 'get').then(res => {
                  console.log('consoles:', res)
                  setConsoles(res)
                })
            }
        })
      }, 500)
    })
  }

  const startSession = (sessionId) => {
    console.log('sessionId:', sessionId)
    router.push('stream/' + sessionId)
  }

  return (
    <>
      <Navbar>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem isActive>
            <Link aria-current="page">
              Consoles
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/xcloud">
              Xcloud
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/settings">
              Settings
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button color="primary" href="#" variant="flat"
            onClick={() => {
              router.push('stream/' + 12345)
            }}>
              Test
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      { loading && <Loading loadingText={'loading'} /> }

      <AuthModal show={showLoginModal} onConfirm={handleLogin}/>

      <div>
        {
          consoles.map(console => {
            return (
              <Card className="max-w-[200px]" key={console.id}>
                <CardBody>
                  <p>{ console.name }</p>
                  <p>{ console.powerState }</p>
                </CardBody>
                <Divider />
                <CardFooter>
                  <Button color="primary" fullWidth onClick={() => startSession(console.id)}>
                    Start
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        }
        
      </div>
    </>
  );
}

export default Home;
