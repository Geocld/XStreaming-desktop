import { useState, useEffect } from 'react'
import { useParams } from "react-router-dom";
import xStreamingPlayer from 'xstreaming-player';

import XcloudApi from '../../xCloud';

console.log('xStreamingPlayer:', xStreamingPlayer);

function Stream() {
  const { id: serverId } = useParams();

  const [xPlayer, setxPlayer] = useState(undefined)
  
  useEffect(() => {
    if (xPlayer !== undefined) {
      xPlayer.bind();

      console.log('Starting xStreamingPlayer...');

      let xHomeToken: any = sessionStorage.getItem('xHomeToken');
      xHomeToken = JSON.parse(xHomeToken);

      const defaultRegion = xHomeToken.offeringSettings.regions.filter(
        region => region.isDefault,
      )[0];

      const xHomeApi = new XcloudApi(
        defaultRegion.baseUri,
        xHomeToken.gsToken,
        'home'
      );
      
      xHomeApi.startSession(serverId).then(() => {
        xHomeApi.waitState().then(() => {
          xHomeApi.getSessionConfig().then(configs => {
            console.log('configs:', configs);
          })
        })
      })

    } else {
      setxPlayer(new xStreamingPlayer('videoHolder', {
        ui_systemui: [],
        ui_touchenabled: false,
        input_legacykeyboard: false,
      }));
    }
    return () => {
      if(xPlayer !== undefined) {
        xPlayer.close();
      }
    };
  }, [xPlayer]);
  
  return (
    <>
      <div id="videoHolder"></div>
    </>
  )
}

export default Stream;