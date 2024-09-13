import { useEffect, useState, useRef } from "react";
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
  CardHeader, 
  CardBody, 
  CardFooter,
  Image,
} from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import Layout from "../components/Layout";
import TitleItem from "../components/TitleItem";
import TitleModal from "../components/TitleModal";
import Ipc from "../lib/ipc";

function Xcloud() {
  const { t } = useTranslation();

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("")
  const [isLimited, setIsLimited] = useState(false)
  const [titlesMap, setTitlesMap] = useState({})
  const [currentTitle, setCurrentTitle] = useState({})
  const [showTitleDetail, setShowTitleDetail] = useState(false)
  const [titles, setTitles] = useState([])

  useEffect(() => {
    Ipc.send('app', 'getAppLevel').then(appLevel => {
      console.log('appLevel:', appLevel)
      if (appLevel !== 2) {
        setIsLimited(true)
      } else {
        console.log('Get titles')
        Ipc.send('xCloud', 'getTitles').then(res => {
          console.log('originTitles:', res.results)
          Ipc.send('xCloud', 'getGamePassProducts', res.results).then(_titles => {
            setTitles(_titles)
            const _titleMap = {}
            _titles.forEach(item => {
              _titleMap[item.productId] = item
            })

            console.log('_titleMap:', _titleMap)
            setTitlesMap(_titleMap)

            Ipc.send('xCloud', 'getNewTitles').then(newTitleRes => {
              console.log('newTitleRes:', newTitleRes)

              Ipc.send('xCloud', 'getRecentTitles').then(recentTitleRes => {
                console.log('recentTitleRes:', recentTitleRes)
              })
            })
          })
        })
      }
    })
  }, []);

  const handleViewTitleDetail = (titleItem) => {
    console.log('titleItem:', titleItem)
    setCurrentTitle(titleItem)
    setShowTitleDetail(true)
  }

  return (
    <>
      <Navbar isBordered>
        <NavbarBrand>
          <p className="font-bold text-inherit">XStreaming</p>
        </NavbarBrand>
        <NavbarContent className="sm:flex gap-10" justify="center">
          <NavbarItem>
            <Link color="foreground" href="/home">
              Consoles
            </Link>
          </NavbarItem>
          <NavbarItem isActive>
            <Link aria-current="page" href="/xcloud">
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
            <Button color="primary" href="#" variant="flat">
              Test
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <Layout>

        {showTitleDetail && <TitleModal title={currentTitle} onClose={() => setShowTitleDetail(false)}/>}

        <Tabs aria-label="Options">
          <Tab key="Recently" title="Recently">
            <div className="gap-2 grid grid-cols-2 sm:grid-cols-6">
              {
                titles.map(title => {
                  return (
                    <TitleItem title={title} key={title.XCloudTitleId} onClick={handleViewTitleDetail}/>
                  )
                })
              }
            </div>
          </Tab>
          <Tab key="Newest" title="Newest">
            Newest
          </Tab>
          <Tab key="All" title="All">
            All
          </Tab>
        </Tabs>
      </Layout>
    </>
  );
}

export default Xcloud;
