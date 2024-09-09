import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import xStreamingPlayer from "xstreaming-player";
import Ipc from "../../lib/ipc";

function Stream() {
  const router = useRouter();
  // const { settings } = useSettings()

  let streamStateInterval;
  let keepaliveInterval;

  const [xPlayer, setxPlayer] = useState(undefined);
  const [sessionId, setSessionId] = useState("");
  const [queueTime, setQueueTime] = useState(0);

  useEffect(() => {
    let streamType = "home";
    let serverId = router.query.serverid;

    console.log('serverId:', serverId)

    if (xPlayer !== undefined) {
      xPlayer.bind();

      xPlayer.setGamepadKernal('Web')

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
          }, 30000);
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

  function onDisconnect() {
    Ipc.send("streaming", "stopStream", {
      sessionId: sessionId,
    }).then((result) => {
      console.log("Stream stopped:", result);
    });

    if (streamStateInterval) {
      clearInterval(streamStateInterval);
    }
  }

  return (
    <>
      <div id="videoHolder"></div>
    </>
  );
}

export default Stream;
