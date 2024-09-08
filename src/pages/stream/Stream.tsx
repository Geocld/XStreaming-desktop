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

            xPlayer.createOffer().then((offer: any) => {
              console.log('local offer:', offer);
              xHomeApi.sendSdp(offer.sdp).then(() => {
                xHomeApi.getSdp().then(res => {
                  console.log('remote offer1:', res);

                  const sdpDetails = JSON.parse(res.exchangeResponse);
                  console.log('remote offer2:', sdpDetails);
                  xPlayer.setRemoteOffer(sdpDetails.sdp);

                  // Gather candidates
                  const iceCandidates = xPlayer.getIceCandidates();
                  const candidates = [];
                  for(const candidate in iceCandidates) {
                    candidates.push({
                      candidate: iceCandidates[candidate].candidate,
                      sdpMLineIndex: iceCandidates[candidate].sdpMLineIndex,
                      sdpMid: iceCandidates[candidate].sdpMid,
                    });
                  }
                  console.log('local ice:', candidates);
                  xHomeApi.sendIce(candidates).then(() => {
                    xHomeApi.getIce().then(res => {
                      const exchangeIce = res.exchange_response;
                      console.log('remote ice:', exchangeIce);
                      xPlayer.setIceCandidates(exchangeIce);
                      // Listen for connection change
                      xPlayer.getEventBus().on('connectionstate', (event: any) => {
                        console.log(':: Connection state updated:', event);
                      });
                    });
                  });
                });
              });
            });
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
        setxPlayer(null);
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