import React, { useState, useEffect } from 'react'
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from "@nextui-org/react"
import { useTranslation } from 'react-i18next'
// import { useGamepads } from 'react-gamepads';

import A from '../assets/gamepad/a.svg'
import B from '../assets/gamepad/b.svg'
import X from '../assets/gamepad/x.svg'
import Y from '../assets/gamepad/y.svg'
import DPadUp from '../assets/gamepad/gamepad-up.svg'
import DPadDown from '../assets/gamepad/gamepad-down.svg'
import DPadLeft from '../assets/gamepad/gamepad-left.svg'
import DPadRight from '../assets/gamepad/gamepad-right.svg'
import LeftShoulder from '../assets/gamepad/lb.svg'
import RightShoulder from '../assets/gamepad/rb.svg'
import LeftTrigger from '../assets/gamepad/lt.svg'
import RightTrigger from '../assets/gamepad/rt.svg'
import LeftThumb from '../assets/gamepad/left-joystick-down.svg'
import RightThumb from '../assets/gamepad/right-joystick-down.svg'
import View from '../assets/gamepad/view.svg'
import Menu from '../assets/gamepad/menu.svg'
import Nexus from '../assets/gamepad/xbox.svg'

import './GamepadMapModal.scss'

const maping = {
  A,
  B,
  X,
  Y,
  DPadUp,
  DPadDown,
  DPadLeft,
  DPadRight,
  LeftShoulder,
  RightShoulder,
  LeftTrigger,
  RightTrigger,
  LeftThumb,
  RightThumb,
  Menu,
  View,
  Nexus
}

const GamepadMapModal = ({ show, current, onConfirm, onCancel }) => {
  const { t } = useTranslation()
  const [timer, setTimer] = useState(null)
  const [gamepads, setGamepads] = useState([])
  const [isConfirm, setIsConfirm] = useState(false)

  useEffect(() => {
    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      let _gamepad = null
      gamepads.forEach(gp => {
        if (gp) _gamepad = gp
      })
      if (_gamepad) {
        _gamepad.buttons.forEach((b, idx) => {
          if (b.pressed) {
            clearInterval(timer)
            if (!isConfirm) {
              onConfirm && onConfirm(current, idx)
            }
            setIsConfirm(true)
          }
        })
      }
    }

    const timer = setInterval(pollGamepads, 100);

    return () => clearInterval(timer);
  }, []);

  const handleCancel = () => {
    onCancel && onCancel()
  }

  return (
    <Modal isOpen={show} hideCloseButton={true}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Key Maping')}</ModalHeader>
          <ModalBody className="map-modal-body">
            <p>{t('Please press the button on the controller, which will be mapped to:')} </p>
            <div className="icon-wrap">
              <img className="icon" src={maping[current]} alt="" />
            </div>
            <p>{t('After successful mapping, this pop-up will automatically close')}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" fullWidth onClick={handleCancel}>
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}

export default GamepadMapModal
