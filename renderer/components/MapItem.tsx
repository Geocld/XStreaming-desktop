import Image from "next/image";

const maping = {
  A: '/images/gamepad/a.svg',
  B: '/images/gamepad/b.svg',
  X: '/images/gamepad/x.svg',
  Y: '/images/gamepad/y.svg',
  DPadUp: '/images/gamepad/gamepad-up.svg',
  DPadDown: '/images/gamepad/gamepad-down.svg',
  DPadLeft: '/images/gamepad/gamepad-left.svg',
  DPadRight: '/images/gamepad/gamepad-right.svg',
  LeftShoulder: '/images/gamepad/lb.svg',
  RightShoulder: '/images/gamepad/rb.svg',
  LeftTrigger: '/images/gamepad/lt.svg',
  RightTrigger: '/images/gamepad/rt.svg',
  LeftThumb: '/images/gamepad/left-joystick-down.svg',
  RightThumb: '/images/gamepad/right-joystick-down.svg',
  Menu: '/images/gamepad/menu.svg',
  View: '/images/gamepad/view.svg',
  Nexus: '/images/gamepad/xbox.svg'
}

const MapItem = ({ name, value, onPress }) => {

  const handleClick = () => {
    onPress && onPress(name)
  }

  return (
    <div className='map-item' onClick={handleClick}>
      <div className='left'>
        <Image
          src={maping[name]}
          alt={name}
          width={40}
          height={40}
        />
      </div>
      <div className='center'>
        <Image
          src="/images/gamepad/arrow-right.svg"
          alt="arrow-right"
          width={40}
          height={40}
        />
      </div>
      <div className='right'>{ value }</div>
    </div>
  )
}

export default MapItem
