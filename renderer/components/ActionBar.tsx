import { useEffect } from "react";
import { useTranslation } from "next-i18next";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import Ipc from "../lib/ipc";

const CONNECTED = 'connected';

function ActionBar(props) {
  const { t } = useTranslation('cloud');

  useEffect(() => {
    let lastMovement = 0;
    const mouseEvent = () => {
      lastMovement = Date.now();
    };
    window.addEventListener("mousemove", mouseEvent);
    window.addEventListener("mousedown", mouseEvent);

    const escEvent = (event) => {
      if (event.key === 'Escape') {
        Ipc.send('app', 'exitFullscreen')
      }
    }
    window.addEventListener('keydown', escEvent)

    const mouseInterval = setInterval(() => {
      const gamebarElement = document.getElementById("actionBar");
      if (gamebarElement === null) {
        return;
      }

      if (Date.now() - lastMovement >= 2000) {
        if (!gamebarElement.className.includes("hidden")) {
          gamebarElement.className = "hidden";
        }
      } else {
        if (gamebarElement.className.includes("hidden")) {
          gamebarElement.className = "";
        }
      }
    }, 100);

    return () => {
      if (mouseInterval) clearInterval(mouseInterval);

      window.removeEventListener("mousemove", mouseEvent);
      window.removeEventListener("mousedown", mouseEvent);
      window.removeEventListener('keydown', escEvent)
    };
  }, []);

  const handleDisconnect = () => {
    props.onDisconnect && props.onDisconnect();
  };

  const handleTogglePerformance = () => {
    props.onTogglePerformance && props.onTogglePerformance();
  };

  const handleDisplay = () => {
    props.onDisplay && props.onDisplay();
  };

  const handlePressNexus = () => {
    props.onPressNexus && props.onPressNexus();
  };

  const handleLongPressNexus = () => {
    props.onLongPressNexus && props.onLongPressNexus();
  };

  const handleToggleFullscreen = () => {
    Ipc.send('app', 'toggleFullscreen')
  }

  return (
    <div id="actionBar">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" size="sm">
            {t("Menu")}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          {
            props.connectState === CONNECTED && (
              <DropdownItem key="performance" onClick={handleTogglePerformance}>
                {t("Toggle Performance")}
              </DropdownItem>
            )
          }
          
          {
            props.connectState === CONNECTED && (
              <DropdownItem key="display" onClick={handleDisplay}>
                {t("Display settings")}
              </DropdownItem>
            )
          }

          {
            props.connectState === CONNECTED && (
              <DropdownItem key="pressNexus" onClick={handlePressNexus}>
                {t("Press Nexus")}
              </DropdownItem>
            )
          }

          {
            props.connectState === CONNECTED && (
              <DropdownItem key="longPressNexus" onClick={handleLongPressNexus}>
                {t("Long press Nexus")}
              </DropdownItem>
            )
          }
          
          <DropdownItem key="fullscreen" onClick={handleToggleFullscreen}>
            {t("Toggle fullscreen")}
          </DropdownItem>
          <DropdownItem
            key="disconnect"
            className="text-danger"
            color="danger"
            onClick={handleDisconnect}
          >
            {t("Disconnect")}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

export default ActionBar;
