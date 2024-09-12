import { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { NexusIcon } from "./NexusIcon";

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
    props.onDisconnect && props.onDisconnect()
  }

  return (
    <div id="actionBar">
      <Button color="danger" size="sm" onClick={handleDisconnect}>
        Disconnect
      </Button>

      {/* <Button isIconOnly color="danger" size="sm">
        <NexusIcon />
      </Button> */}
    </div>
  );
}

export default ActionBar;
