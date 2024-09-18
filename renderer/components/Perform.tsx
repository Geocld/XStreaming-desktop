import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function Perform({ xPlayer, connectState }) {
  const { t } = useTranslation();
  const [performance, setPerformance] = useState<any>({});

  useEffect(() => {
    let perfInterval;
    if (!perfInterval) {
      perfInterval = setInterval(() => {
        if (xPlayer && connectState === "connected")
          xPlayer.getStreamState &&
            xPlayer.getStreamState().then((perf) => {
              setPerformance(perf);
            });
      }, 2000);
    }

    return () => {
      if (perfInterval) {
        clearInterval(perfInterval);
      }
    };
  }, [xPlayer, connectState]);

  return (
    <div id="performances" className="flex">
      <div className="px-1">
        {t("Resolution")}: {performance.resolution || "--"} &nbsp;| &nbsp;
      </div>
      <div className="px-1">
        {t("Round Trip Time")}: {performance.rtt || "--"}|
      </div>
      <div className="px-1">
        {t("FPS")}: {performance.fps || "--"}|
      </div>
      <div className="px-1">
        {t("Frames Dropped")}: {performance.fl || "--"}|
      </div>
      <div className="px-1">
        {t("Packets Lost")}: {performance.pl || "--"}|
      </div>
      <div className="px-1">
        {t("Bitrate")}: {performance.br || "--"}|
      </div>
      <div className="px-1">
        {t("Decode time")}: {performance.decode || "--"}
      </div>
    </div>
  );
}

export default Perform;
