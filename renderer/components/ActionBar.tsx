import { useState, useEffect } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";

function ActionBar(props) {
  let lastMovement = 0;

  useEffect(() => {
    const mouseEvent = () => {
      lastMovement = Date.now();
    };
    window.addEventListener("mousemove", mouseEvent);
    window.addEventListener("mousedown", mouseEvent);

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
    };
  }, []);

  const handleDisconnect = () => {
    props.onDisconnect && props.onDisconnect();
  };

  const handleTogglePerformance = () => {
    props.onTogglePerformance && props.onTogglePerformance();
  };

  return (
    <div id="actionBar">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" size="sm">
            Menu
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          <DropdownItem key="performance" onClick={handleTogglePerformance}>
            Toggle performance
          </DropdownItem>
          <DropdownItem key="pressNexus">Press Nexus</DropdownItem>
          <DropdownItem key="longPressNexus">Long Press Nexus</DropdownItem>
          {/* <DropdownItem key="display">Display</DropdownItem> */}
          <DropdownItem
            key="disconnect"
            className="text-danger"
            color="danger"
            onClick={handleDisconnect}
          >
            DisConnect
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* <Button isIconOnly color="danger" size="sm">
        <NexusIcon />
      </Button> */}
    </div>
  );
}

export default ActionBar;
