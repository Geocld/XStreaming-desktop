import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";

function Perform({ xPlayer, connectState }) {
  const { t } = useTranslation('cloud');
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
    <div id="performances">
      <div className="px-1">
        {t("Resolution")}: {performance.resolution || "--"}
      </div>
      <div className="px-1">
        {t("RTT")}: {performance.rtt || "--"}
      </div>
      <div className="px-1">
        {t("FPS")}: {performance.fps || "--"}
      </div>
      <div className="px-1">
        {t("FD")}: {performance.fl || "--"}
      </div>
      <div className="px-1">
        {t("PL")}: {performance.pl || "--"}
      </div>
      <div className="px-1">
        {t("Bitrate")}: {performance.br || "--"}
      </div>
      <div className="px-1">
        {t("DT")}: {performance.decode || "--"}
      </div>
    </div>
  );
}

export default Perform;
