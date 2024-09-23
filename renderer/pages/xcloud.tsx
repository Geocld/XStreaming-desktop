import { useEffect, useState, useRef } from "react";
import { Tabs, Tab, Input } from "@nextui-org/react";
import { useTranslation } from "next-i18next";
import type { GetStaticProps } from "next";
import { useRouter } from 'next/router';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Layout from "../components/Layout";
import TitleItem from "../components/TitleItem";
import TitleModal from "../components/TitleModal";
import Ipc from "../lib/ipc";
import Nav from "../components/Nav";
import Loading from "../components/Loading";
import SearchIcon from "../components/SearchIcon";

function Xcloud() {
  const { t } = useTranslation("cloud");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [isLimited, setIsLimited] = useState(false);
  const [currentTab, setCurrentTab] = useState("Recently");
  const [currentTitle, setCurrentTitle] = useState({});
  const [showTitleDetail, setShowTitleDetail] = useState(false);
  const [titles, setTitles] = useState([]);
  const [newTitles, setNewTitles] = useState([]);
  const [recentTitles, setRecentNewTitles] = useState([]);
  const currentTitles = useRef([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {

    setLoading(true);
    setLoadingText(t("Loading..."));
    Ipc.send("app", "getAppLevel").then((appLevel) => {
      console.log("appLevel:", appLevel);
      if (appLevel !== 2) {
        setIsLimited(true);
        setLoading(false);
      } else {
        console.log("Get titles");
        Ipc.send("xCloud", "getTitles").then((res) => {
          console.log("originTitles:", res.results);
          Ipc.send("xCloud", "getGamePassProducts", res.results).then(
            (_titles) => {
              setTitles(_titles);
              const _titleMap = {};
              _titles.forEach((item) => {
                _titleMap[item.productId] = item;
              });

              console.log("_titleMap:", _titleMap);

              // Get new games
              Ipc.send("xCloud", "getNewTitles").then((newTitleRes) => {
                console.log("newTitleRes:", newTitleRes);
                const _newTitles = [];
                newTitleRes.forEach((item) => {
                  if (item.id && _titleMap[item.id]) {
                    _newTitles.push(_titleMap[item.id]);
                  }
                });
                setNewTitles(_newTitles);

                // Get recent games
                Ipc.send("xCloud", "getRecentTitles").then((recentTitleRes) => {
                  console.log("recentTitleRes:", recentTitleRes.results);
                  const results = recentTitleRes.results || [];
                  const _recentTitles = [];
                  results.forEach((item) => {
                    if (item.details && item.details.productId) {
                      const productId = item.details.productId;
                      const productIdUp = productId.toUpperCase();
                      if (_titleMap[productId] || _titleMap[productIdUp]) {
                        _recentTitles.push(
                          _titleMap[productId] || _titleMap[productIdUp]
                        );
                      }
                    }
                  });
                  setRecentNewTitles(_recentTitles);
                  setLoading(false);
                });
              });
            }
          );
        });
      }
    });
  }, [t]);

  const handleViewTitleDetail = (titleItem: any) => {
    console.log("titleItem:", titleItem);
    setCurrentTitle(titleItem);
    setShowTitleDetail(true);
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  switch (currentTab) {
    case "Recently":
      currentTitles.current = recentTitles;
      break;
    case "Newest":
      currentTitles.current = newTitles;
      break;
    case "All":
      currentTitles.current = titles;
      break;
    default:
      currentTitles.current = [];
      break;
  }

  if (keyword.length > 0) {
    currentTitles.current = currentTitles.current.filter((title) => {
      return (
        title.ProductTitle.toUpperCase().indexOf(keyword.toUpperCase()) > -1
      );
    });
  }

  console.log("currentTitles:", currentTitles.current);
  return (
    <>
      <Nav current={t("Xcloud")} isLogined={true} locale={router.locale} />

      {loading && <Loading loadingText={loadingText} />}

      <Layout>
        {showTitleDetail && (
          <TitleModal
            title={currentTitle}
            onClose={() => setShowTitleDetail(false)}
          />
        )}

        {isLimited ? (
          <div>{t("NoXGP")}</div>
        ) : (
          <>
            <div className="flex justify-between">
              <div className="flex-1">
                <Tabs aria-label="Options" onSelectionChange={handleTabChange}>
                  <Tab key="Recently" title={t("Recently")}></Tab>
                  <Tab key="Newest" title={t("Newest")}></Tab>
                  <Tab key="All" title={t("All")}></Tab>
                </Tabs>
              </div>
              <div className="w-50">
                <Input
                  label={t("Search")}
                  size="sm"
                  isClearable
                  classNames={{
                    label: "text-black/50 dark:text-white/90",
                    input: [
                      "bg-transparent",
                      "text-black/90 dark:text-white/90",
                      "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                    ],
                    innerWrapper: ["bg-transparent"],
                    inputWrapper: [
                      "shadow-xl",
                      "bg-default-200/50",
                      "dark:bg-default/60",
                      "backdrop-blur-xl",
                      "backdrop-saturate-200",
                      "hover:bg-default-200/70",
                      "dark:hover:bg-default/70",
                      "group-data-[focus=true]:bg-default-200/50",
                      "dark:group-data-[focus=true]:bg-default/60",
                      "!cursor-text",
                    ],
                  }}
                  startContent={
                    <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
                  }
                  onValueChange={(value) => {
                    setKeyword(value);
                  }}
                />
              </div>
            </div>

            {!loading && currentTitles.current && (
              <div className="gap-2 grid grid-cols-2 sm:grid-cols-6 pt-10">
                {currentTitles.current.map((title) => {
                  return (
                    <TitleItem
                      title={title}
                      key={title.XCloudTitleId}
                      onClick={handleViewTitleDetail}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </Layout>
    </>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common", "cloud"])),
  },
});

export default Xcloud;
