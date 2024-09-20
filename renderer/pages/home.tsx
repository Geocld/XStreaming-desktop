import { useEffect, useState, useRef } from "react"
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    Divider,
    Chip
} from "@nextui-org/react";
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import Layout from "../components/Layout"
import AuthModal from "../components/AuthModal"
import Ipc from "../lib/ipc";
import Loading from '../components/Loading'
import Nav from "../components/Nav";

import {useTheme} from "next-themes"

import Image from 'next/image';

function Home() {

  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [isLogined, setIsLogined] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [consoles, setConsoles] = useState([])

  const authInterval = useRef(null)

  useEffect(() => {
    setLoading(true)
    setLoadingText('Loading...')
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
                  setIsLogined(true)
  
                  // Get Consoles
                  setLoadingText('Fetching consoles...')
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
        setLoading(false)
        setShowLoginModal(true)
      }
    })
    
    return () => {
      if(authInterval.current) clearInterval(authInterval.current)
    }
  }, [])

  const handleLogin = () => {
    setLoading(true)
    setLoadingText('Loading...')
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
                setIsLogined(true)
                window.sessionStorage.setItem('isLogined', '1')
                setLoading(false)

                // Get Consoles
                setLoadingText('Fetching consoles...')
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
      <Nav current={'Consoles'} isLogined={isLogined}/>

      { loading && <Loading loadingText={loadingText} /> }

      <AuthModal show={showLoginModal} onConfirm={handleLogin}/>

      <Layout>
        {
          consoles.map(console => {
            return (
              <Card className="max-w-[200px]" key={console.id}>
                <CardBody>
                  <p className="pb-3 text-center">{ console.name }</p>
                  <div className="flex justify-center items-center">
                    <Image src="/images/xss.svg" alt="xss" width={100} height={100} />
                  </div>
                  <div className="flex justify-center py-2">
                    {console.powerState === 'On' ? (
                      <Chip size="sm" color="success">{t('Powered on')}</Chip>
                    ) : console.powerState === 'ConnectedStandby' ? (
                      <Chip size="sm" color="warning">{t('Standby')}</Chip>
                    ) : (
                      <Chip size="sm">{console.powerState}</Chip>
                    )}
                  </div>
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
        
      </Layout>
    </>
  );
}

export default Home;