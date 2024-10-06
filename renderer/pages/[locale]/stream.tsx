import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import xStreamingPlayer from "xstreaming-player";
import { useTranslation } from "next-i18next";
import Ipc from "../../lib/ipc";
import ActionBar from "../../components/ActionBar";
import Loading from "../../components/Loading";
import Perform from "../../components/Perform";
import FailedModal from "../../components/FailedModal";
import WarningModal from "../../components/WarningModal";
import Display from "../../components/Display";
import { useSettings } from "../../context/userContext";
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

const XCLOUD_PREFIX = "xcloud_";

function Stream() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation("cloud");

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [xPlayer, setxPlayer] = useState(undefined);
  const [connectState, setConnectState] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showPerformance, setShowPerformance] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);
  const [streamingType, setStreamingType] = useState('');
  const connectStateRef = useRef("");
  const keepaliveInterval = useRef(null);
  const streamStateInterval = useRef(null);

  useEffect(() => {
    let streamType = "home";
    let serverId = router.query.serverid as string;

    if (serverId.startsWith(XCLOUD_PREFIX)) {
      streamType = "cloud";
      serverId = serverId.split("_")[1];
    }

    setStreamingType(streamType)

    if (xPlayer !== undefined) {
      xPlayer.bind();

      console.log("streamType:", streamType);
      console.log("serverId:", serverId);
      console.log("settings:", settings);
      console.log("sessionId:", sessionId);

      xPlayer.setVideoFormat(settings.video_format || "");

      // Set video codec profiles
      // xPlayer.setCodecPreferences('video/H264', { profiles: ['4d'] }) // 4d = high, 42e = mid, 420 = low
      if (settings.codec) {
        if (settings.codec.indexOf("H264") > -1) {
          const codecArr = settings.codec.split("-");
          xPlayer.setCodecPreferences(codecArr[0], {
            profiles: codecArr[1] ? [codecArr[1]] : [],
          });
        } else {
          xPlayer.setCodecPreferences(settings.codec, { profiles: [] });
        }
      }

      // Set gamepad kernal
      xPlayer.setGamepadKernal("Web");

      // Set vibration
      xPlayer.setVibration(settings.vibration);
      xPlayer.setVibrationMode("Webview");

      // Set deadzone
      xPlayer.setGamepadDeadZone(settings.dead_zone);

      // Set gamepad maping
      if (settings.gamepad_maping) {
        xPlayer.setGamepadMaping(settings.gamepad_maping)
      }

      // Set bitrate
      if (streamType === "cloud") {
        if (
          settings.xcloud_bitrate_mode === "Custom" &&
          settings.xcloud_bitrate !== 0
        ) {
          console.log(
            "setVideoBitrate xcloud:",
            settings.xcloud_bitrate + "Mb/s"
          );
          xPlayer.setVideoBitrate(settings.xcloud_bitrate);
        }
      } else {
        if (
          settings.xhome_bitrate_mode === "Custom" &&
          settings.xhome_bitrate !== 0
        ) {
          console.log(
            "setVideoBitrate xhome:",
            settings.xhome_bitrate + "Mb/s"
          );
          xPlayer.setVideoBitrate(settings.xhome_bitrate);
        }
      }

      xPlayer.setConnectFailHandler(() => {
        // Not connected
        if (connectStateRef.current === "") {
          setShowWarning(false);
          setShowFailed(true);
        }
      });

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
        console.log("offer:", offer);
        setLoadingText(
          `${t("Configuration obtained successfully, initiating offer...")}`
        );
        Ipc.send("streaming", "sendSdp", {
          sessionId: sessionId,
          sdp: offer.sdp,
        })
          .then((sdpResult: any) => {
            setLoadingText(`${t("Remote offer retrieved successfully...")}`);
            console.log("sdpResult:", sdpResult);
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

            setLoadingText(`${t("Ready to send ICE...")}`);
            Ipc.send("streaming", "sendIce", {
              sessionId: sessionId,
              ice: candidates,
            })
              .then((iceResult: any) => {
                setLoadingText(`${t("Exchange ICE successfully...")}`);
                console.log("iceResult:", iceResult);

                xPlayer.setIceCandidates(iceResult);

                // All done. Waiting for the event 'connectionstate' to be triggered
              })
              .catch((error) => {
                console.log("ICE Exchange error:", error);
                // alert("ICE Exchange error:" + JSON.stringify(error));
              });
          })
          .catch((error) => {
            console.log("SDP Exchange error:", error);
            alert("SDP Exchange error:" + JSON.stringify(error));
          });
      });

      xPlayer.getEventBus().on("connectionstate", (event) => {
        console.log("connectionstate changed:", event);
        setConnectState(event.state);
        connectStateRef.current = event.state;

        if (event.state === "connected") {
          setLoadingText(`${t("Connected")}`);

          setTimeout(() => {
            setLoading(false);

            // Start keepalive loop
            if (!keepaliveInterval.current) {
              console.log("init keepaliveInterval");
              keepaliveInterval.current = setInterval(() => {
                console.log("sendKeepalive sessionId:", sessionId);
                Ipc.send("streaming", "sendKeepalive", {
                  sessionId,
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
            }
          }, 500);
        } else if (event.state === "closed") {
          console.log(":: We are disconnected!");
        }
      });
    } else if (sessionId === "") {
      setLoadingText(`${t("Connecting...")}`);
      Ipc.send("streaming", "startStream", {
        type: streamType,
        target: serverId,
      })
        .then((result: string) => {
          console.log("StartStream sessionId:", result);
          setSessionId(result);
        })
        .catch((error) => {
          alert(
            "Failed to start new stream. Error details:\n" +
              JSON.stringify(error)
          );
        });
    } else {
      if (!streamStateInterval.current) {
        streamStateInterval.current = setInterval(() => {
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
                  clearInterval(streamStateInterval.current);

                  // Start xPlayer interface
                  setxPlayer(
                    new xStreamingPlayer("videoHolder", {
                      ui_systemui: [],
                      ui_touchenabled: false,
                      input_legacykeyboard: true,
                      // @ts-ignore
                      input_mousekeyboard_config: settings.input_mousekeyboard_maping
                    })
                  );
                  break;

                case "failed":
                  // Error
                  clearInterval(streamStateInterval.current);

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
                  break;

                case "queued":
                  // Waiting in queue
                  // @TODO: Show queue position
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
    }

    return () => {
      if (xPlayer !== undefined) {
        xPlayer.close();
      }

      if (keepaliveInterval.current) {
        clearInterval(keepaliveInterval.current);
      }

      if (streamStateInterval.current) {
        clearInterval(streamStateInterval.current);
      }
    };
  }, [xPlayer, sessionId, t, router.query.serverid, settings]);

  const getVideoPlayerFilterStyle = (options) => {
    const filters = [];
    const usmMatrix = document.getElementById("filter-usm-matrix");

    const sharpness = options.sharpness || 0; // sharpness
    if (sharpness !== 0) {
      const level = (7 - (sharpness / 2 - 1) * 0.5).toFixed(1); // 5, 5.5, 6, 6.5, 7
      const matrix = `0 -1 0 -1 ${level} -1 0 -1 0`;
      usmMatrix.setAttributeNS(null, "kernelMatrix", matrix);
      filters.push(`url(#filter-usm)`);
    }

    const saturation = options.saturation || 100; // saturation
    if (saturation != 100) {
      filters.push(`saturate(${saturation}%)`);
    }

    const contrast = options.contrast || 100; // contrast
    if (contrast !== 100) {
      filters.push(`contrast(${contrast}%)`);
    }

    const brightness = options.brightness || 100; // brightness
    if (brightness !== 100) {
      filters.push(`brightness(${brightness}%)`);
    }

    return filters.join(" ");
  };

  const refreshPlayer = (options) => {
    const videoStyle = document.getElementById("video-css");
    const filters = getVideoPlayerFilterStyle(options);
    let videoCss = "";
    if (filters) {
      videoCss += `filter: ${filters} !important;`;
    }
    let css = "";
    if (videoCss) {
      css = `#videoHolder video { ${videoCss} }`;
    }

    videoStyle!.textContent = css;
  };

  const onDisconnect = () => {
    setLoading(true);
    setLoadingText(`${t("Disconnecting...")}`);
    xPlayer && xPlayer.close();

    if (streamStateInterval.current) {
      clearInterval(streamStateInterval.current);
    }

    if (keepaliveInterval.current) {
      clearInterval(keepaliveInterval.current);
    }

    setTimeout(() => {
      console.log("stopStream1111:", sessionId);
      Ipc.send("streaming", "stopStream", {
        sessionId: sessionId,
      })
        .then((result) => {
          console.log("Stream stopped:", result);
          setLoading(false);
          router.back();
        })
        .catch((e) => {
          console.log(e);
          setLoading(false);
          router.back();
        });
    }, 1000);
  };

  const handlePressNexus = () => {
    if (xPlayer && xPlayer.getChannelProcessor("input")) {
      xPlayer.getChannelProcessor("input").pressButtonStart("Nexus");
      setTimeout(() => {
        xPlayer.getChannelProcessor("input").pressButtonEnd("Nexus");
      }, 150);
    }
  };

  const handleLongPressNexus = () => {
    if (xPlayer && xPlayer.getChannelProcessor("input")) {
      xPlayer.getChannelProcessor("input").pressButtonStart("Nexus");
      setTimeout(() => {
        xPlayer.getChannelProcessor("input").pressButtonEnd("Nexus");
      }, 1000);
    }
  };

  return (
    <>
      <ActionBar
        connectState={connectState}
        type={streamingType}
        onDisconnect={onDisconnect}
        onTogglePerformance={() => {
          setShowPerformance(!showPerformance);
        }}
        onDisplay={() => setShowDisplay(true)}
        onPressNexus={handlePressNexus}
        onLongPressNexus={handleLongPressNexus}
      />

      <FailedModal
        show={showFailed}
        onCancel={() => {
          setShowFailed(false);
        }}
      />

      <WarningModal
        show={showWarning}
        onConfirm={() => {
          setShowWarning(false);
          // handleExit('exit')
        }}
        onCancel={() => {
          setShowWarning(false);
        }}
      />
      {showPerformance && (
        <Perform xPlayer={xPlayer} connectState={connectState} />
      )}

      {showDisplay && (
        <Display
          onClose={() => setShowDisplay(false)}
          onValueChange={(options) => {
            refreshPlayer(options);
          }}
        />
      )}

      {loading && <Loading loadingText={loadingText} />}

      <div id="videoHolder">
        {/* <video src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay muted loop playsInline></video> */}
      </div>

      <svg id="video-filters" style={{ display: "none" }}>
        <defs>
          <filter id="filter-usm">
            <feConvolveMatrix
              id="filter-usm-matrix"
              order="3"
            ></feConvolveMatrix>
          </filter>
        </defs>
      </svg>
    </>
  );
}

export default Stream;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common", "cloud"]);

// eslint-disable-next-line react-refresh/only-export-components
export {getStaticPaths};
