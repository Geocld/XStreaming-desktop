import React, { useState, useEffect } from 'react'
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
import arrow from '../assets/gamepad/arrow-right.svg'
import './MapItem.scss'

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

const MapItem = ({ name, value, onPress }) => {
  
  useEffect(() => {
  }, [])

  const handleClick = () => {
    onPress && onPress(name)
  }

  return (
    <div className='map-item' onClick={handleClick}>
      <div className='left'>
        <img src={maping[name]} alt="" />
      </div>
      <div className='center'>
        <img src={arrow} alt="" />
      </div>
      <div className='right'>{ value }</div>
    </div>
  )
}

export default MapItem
