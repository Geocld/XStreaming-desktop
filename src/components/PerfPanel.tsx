import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';

const PerfPanel = ({ xPlayer, connectState }) => {
  const { t } = useTranslation()
  const [performance, setPerformance] = useState(null)

  
  useEffect(() => {
    let perfInterval
    if (!perfInterval) {
      perfInterval = setInterval(() => {
        if (xPlayer && connectState === 'connected')
          xPlayer.getStreamState && xPlayer.getStreamState().then(perf => {
          setPerformance(perf)
        })
      }, 1000)
    }

    return () => {
      if (perfInterval) {
        clearInterval(perfInterval)
      }
    }
  }, [xPlayer, connectState])

  return (
    <>
      {
        performance && (
          <div className='performances'>
            <div>{t('Resolution')}: {performance.resolution || ''}</div>
            <div>{t('Round Trip Time')}: {performance.rtt || ''}</div>
            <div>{t('FPS')}: {performance.fps || ''}</div>
            <div>{t('Frames Dropped')}: {performance.fl || ''}</div>
            <div>{t('Packets Lost')}: {performance.pl || ''}</div>
            <div>{t('Bitrate')}: {performance.br || ''}</div>
            <div>{t('Decode time')}: {performance.decode || ''}</div>
          </div>
        )
      }
    </>
  )
}

export default PerfPanel
