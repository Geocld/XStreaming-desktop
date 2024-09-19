import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";

function ActionBar(props) {
  let lastMovement = 0;
  const { t } = useTranslation();

  // useEffect(() => {
  //   const mouseEvent = () => {
  //     lastMovement = Date.now();
  //   };
  //   window.addEventListener("mousemove", mouseEvent);
  //   window.addEventListener("mousedown", mouseEvent);

  //   const mouseInterval = setInterval(() => {
  //     const gamebarElement = document.getElementById("actionBar");
  //     if (gamebarElement === null) {
  //       return;
  //     }

  //     if (Date.now() - lastMovement >= 2000) {
  //       if (!gamebarElement.className.includes("hidden")) {
  //         gamebarElement.className = "hidden";
  //       }
  //     } else {
  //       if (gamebarElement.className.includes("hidden")) {
  //         gamebarElement.className = "";
  //       }
  //     }
  //   }, 100);

  //   return () => {
  //     if (mouseInterval) clearInterval(mouseInterval);
  //   };
  // }, []);

  const handleDisconnect = () => {
    props.onDisconnect && props.onDisconnect();
  };

  const handleTogglePerformance = () => {
    props.onTogglePerformance && props.onTogglePerformance();
  };

  const handleDisplay = () => {
    props.onDisplay && props.onDisplay();
  }

  const handlePressNexus = () => {
    props.onPressNexus && props.onPressNexus();
  }

  const handleLongPressNexus = () => {
    props.onLongPressNexus && props.onLongPressNexus();
  }

  return (
    <div id="actionBar">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" size="sm">
            {t('Menu')}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          <DropdownItem key="performance" onClick={handleTogglePerformance}>
            {t('Toggle Performance')}
          </DropdownItem>
          <DropdownItem key="display" onClick={handleDisplay}>{t('Display settings')}</DropdownItem>
          <DropdownItem key="pressNexus" onClick={handlePressNexus}>{t('Press Nexus')}</DropdownItem>
          <DropdownItem key="longPressNexus" onClick={handleLongPressNexus}>{t('Long press Nexus')}</DropdownItem>
          <DropdownItem
            key="disconnect"
            className="text-danger"
            color="danger"
            onClick={handleDisconnect}
          >
            {t('Disconnect')}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

export default ActionBar;
