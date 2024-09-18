import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import xStreamingPlayer from "xstreaming-player";
import Ipc from "../../lib/ipc";
import ActionBar from "../../components/ActionBar";
import Perform from "../../components/Perform";
import { useSettings } from "../../context/userContext";

const XCLOUD_PREFIX = 'xcloud_'

function Stream() {
  const router = useRouter();
  const { settings } = useSettings()

  let streamStateInterval;
  let keepaliveInterval;

  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('')
  const [xPlayer, setxPlayer] = useState(undefined)
  const [connectState, setConnectState] = useState('')
  const [sessionId, setSessionId] = useState("")
  const [queueTime, setQueueTime] = useState(0)
  const [showPerformance, setShowPerformance] = useState(false)

  useEffect(() => {
    let streamType = "home";
    let serverId = router.query.serverid as string;

    if (serverId.startsWith(XCLOUD_PREFIX)) {
      streamType = 'cloud';
      serverId = serverId.split('_')[1];
    }

    console.log('streamType:', streamType);
    console.log('serverId:', serverId);

    if (xPlayer !== undefined) {
      xPlayer.bind();

      xPlayer.setVideoFormat(settings.video_format || '')

      // Set video codec profiles
      // xPlayer.setCodecPreferences('video/H264', { profiles: ['4d'] }) // 4d = high, 42e = mid, 420 = low
      if (settings.codec) {
        if (settings.codec.indexOf('H264') > -1) {
          const codecArr = settings.codec.split('-')
          xPlayer.setCodecPreferences(codecArr[0], { profiles: codecArr[1] ? [codecArr[1]] : [] })
        } else {
          xPlayer.setCodecPreferences(settings.codec, { profiles: [] })
        }
      }

      // Set gamepad kernal
      xPlayer.setGamepadKernal('Web')

      // Set vibration
      xPlayer.setVibration(settings.vibration)

      // Set deadzone
      xPlayer.setGamepadDeadZone(settings.dead_zone)

      // Set bitrate
      if (streamType === 'cloud') {
        if (settings.xcloud_bitrate_mode === 'Custom' && settings.xcloud_bitrate !== 0) {
          console.log('setVideoBitrate xcloud:', settings.xcloud_bitrate + 'Mbps')
          xPlayer.setVideoBitrate(settings.xcloud_bitrate * 1000)
        }
      } else {
        if (settings.xhome_bitrate_mode === 'Custom' && settings.xhome_bitrate !== 0) {
          console.log('setVideoBitrate xhome:', settings.xhome_bitrate + 'Mbps')
          xPlayer.setVideoBitrate(settings.xhome_bitrate * 1000)
        }
      }

      xPlayer.setConnectFailHandler(() => {
        // TODO
        // Not connected
        // if (connectStateRef.current === '') {
        //   if (timer.current) {
        //     clearTimeout(timer.current)
        //   }
        //   setShowWarning(false)
        //   setShowFailed(true)
        // }
      })

      xPlayer.setSdpHandler((client, offer) => {
        Ipc.send("streaming", "sendChatSdp", {
          sessionId: sessionId,
          sdp: offer.sdp,
        })
        .then((sdpResponse) => {
          xPlayer.setRemoteOffer(sdpResponse.sdp);
        })
        .catch((error) => {
          console.log("ChatSDP Exchange error:", error);
          alert("ChatSDP Exchange error:" + JSON.stringify(error));
        });
      });

      xPlayer.createOffer().then((offer: any) => {
        Ipc.send("streaming", "sendSdp", {
          sessionId: sessionId,
          sdp: offer.sdp,
        })
          .then((sdpResult: any) => {
            xPlayer.setRemoteOffer(sdpResult.sdp);

            // Gather candidates
            const iceCandidates = xPlayer.getIceCandidates();
            const candidates = [];
            for (const candidate in iceCandidates) {
              candidates.push({
                candidate: iceCandidates[candidate].candidate,
                sdpMLineIndex: iceCandidates[candidate].sdpMLineIndex,
                sdpMid: iceCandidates[candidate].sdpMid,
              });
            }

            Ipc.send("streaming", "sendIce", {
              sessionId: sessionId,
              ice: candidates,
            })
              .then((iceResult: any) => {
                console.log(iceResult);
                xPlayer.setIceCandidates(iceResult);

                // All done. Waiting for the event 'connectionstate' to be triggered
              })
              .catch((error) => {
                console.log("ICE Exchange error:", error);
                alert("ICE Exchange error:" + JSON.stringify(error));
              });
          })
          .catch((error) => {
            console.log("SDP Exchange error:", error);
            alert("SDP Exchange error:" + JSON.stringify(error));
          });
      });

      xPlayer.getEventBus().on("connectionstate", (event) => {
        console.log("connectionstate changed:", event);
        setConnectState(event.state)
        if (event.state === "connected") {
          // Start keepalive loop
          keepaliveInterval = setInterval(() => {
            Ipc.send("streaming", "sendKeepalive", {
              sessionId: sessionId,
            })
              .then((result) => {
                console.log("StartStream keepalive:", result);
              })
              .catch((error) => {
                console.error(
                  "Failed to send keepalive. Error details:\n" +
                    JSON.stringify(error)
                );
              });
          }, 30 * 1000);
        } else if(event.state === 'closed') {
          console.log(':: We are disconnected!')
        }
      });
    } else if (sessionId === "") {
      Ipc.send("streaming", "startStream", {
        type: streamType,
        target: serverId,
      })
        .then((result: string) => {
          console.log("StartStream session:", result);
          setSessionId(result);
        })
        .catch((error) => {
          alert(
            "Failed to start new stream. Error details:\n" +
              JSON.stringify(error)
          );
        });
    } else {
      streamStateInterval = setInterval(() => {
        Ipc.send("streaming", "getPlayerState", {
          sessionId: sessionId,
        })
          .then((session: any) => {
            console.log("Player state:", session);

            switch (session.playerState) {
              case "pending":
                // Waiting for console to start
                break;

              case "started":
                // Console is ready
                clearInterval(streamStateInterval);

                // Start xPlayer interface
                setxPlayer(
                  new xStreamingPlayer("videoHolder", {
                    ui_systemui: [],
                    ui_touchenabled: false,
                    input_legacykeyboard: true,
                  })
                );
                break;

              case "failed":
                // Error
                clearInterval(streamStateInterval);

                if (
                  session.errorDetails.code === "WNSError" &&
                  session.errorDetails.message.includes(
                    "WaitingForServerToRegister"
                  )
                ) {
                  // Detected the "WaitingForServerToRegister" error. This means the console is not connected to the xbox servers
                  alert(
                    "Unable to start stream session on console. The console is not connected to the Xbox servers. This ocasionally happens then there is an update or when the user is not signed in to the console. Please hard reboot your console and try again.\n\n" +
                      "Stream error result: " +
                      session.state +
                      "\nDetails: [" +
                      session.errorDetails.code +
                      "] " +
                      session.errorDetails.message
                  );
                } else {
                  alert(
                    "Stream error result: " +
                      session.state +
                      "\nDetails: [" +
                      session.errorDetails.code +
                      "] " +
                      session.errorDetails.message
                  );
                }
                console.log("Full stream error:", session.errorDetails);
                onDisconnect();
                xPlayer.close();
                break;

              case "queued":
                // Waiting in queue
                // @TODO: Show queue position
                if (queueTime === 0) {
                  setQueueTime(
                    session.waitingTimes.estimatedTotalWaitTimeInSeconds
                  );
                  console.log(
                    "Setting queue to:",
                    session.waitingTimes.estimatedTotalWaitTimeInSeconds
                  );
                }
                break;
            }
          })
          .catch((error) => {
            alert(
              "Failed to get player state. Error details:\n" +
                JSON.stringify(error)
            );
          });
      }, 1000);
    }

    return () => {
      if (xPlayer !== undefined) {
        xPlayer.close();
      }

      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }

      if (streamStateInterval) {
        clearInterval(streamStateInterval);
      }
    };
  });

  const onDisconnect = () => {
    setLoading(true)
    xPlayer && xPlayer.close()
    if (streamStateInterval) {
      clearInterval(streamStateInterval)
    }
    Ipc.send("streaming", "stopStream", {
      sessionId: sessionId,
    }).then((result) => {
      console.log("Stream stopped:", result)
      setLoading(false)
      router.back()
    }).catch(e => {
      setLoading(false)
      router.back()
    })
  }

  return (
    <>
      <ActionBar 
        onDisconnect={onDisconnect}
        onTogglePerformance={() => {
          setShowPerformance(!showPerformance)
        }}
      />
      {
        showPerformance && <Perform xPlayer={xPlayer} connectState={connectState}/>
      }
      
      {/* <div id="videoHolder"></div> */}
      <div id="videoHolder">
        {/* <video src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay muted loop playsInline></video> */}
      </div>
    </>
  );
}

export default Stream;
