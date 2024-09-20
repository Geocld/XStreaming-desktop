import i18next from '../i18n'

const {t} = i18next

const settings = {
  language: [
    {
      name: 'locale',
      type: 'select',
      title: t('App language'),
      needRestart: true,
      description: t('Set language of XStreaming'),
      data: [
        {value: 'en', label: 'English'},
        {value: 'zh', label: '简体中文'},
        {value: 'zht', label: '繁體中文'},
        {value: 'jp', label: '日本語'},
      ],
    },
    {
      name: 'preferred_game_language',
      type: 'select',
      title: t('Preferred language of game'),
      description: t('Set language of cloud game'),
      data: [
        {value: '', label: 'Default'},
        {value: 'ar-SA', label: 'Arabic (Saudi Arabia)'},
        {value: 'cs-CZ', label: 'Czech'},
        {value: 'da-DK', label: 'Danish'},
        {value: 'de-DE', label: 'German'},
        {value: 'el-GR', label: 'Greek'},
        {value: 'en-GB', label: 'English (United Kingdom)'},
        {value: 'en-US', label: 'English (United States)'},
        {value: 'es-ES', label: 'Spanish (Spain)'},
        {value: 'es-MX', label: 'Spanish (Mexico)'},
        {value: 'fi-FI', label: 'Swedish'},
        {value: 'fr-FR', label: 'French'},
        {value: 'he-IL', label: 'Hebrew'},
        {value: 'hu-HU', label: 'Hungarian'},
        {value: 'it-IT', label: 'Italian'},
        {value: 'ja-JP', label: '日本語'},
        {value: 'ko-KR', label: 'Korean'},
        {value: 'nb-NO', label: 'Norwegian'},
        {value: 'nl-NL', label: 'Dutch'},
        {value: 'pl-PL', label: 'Polish'},
        {value: 'pt-BR', label: 'Portuguese (Brazil)'},
        {value: 'pt-PT', label: 'Portuguese (Portugal)'},
        {value: 'ru-RU', label: 'Russian'},
        {value: 'sk-SK', label: 'Slovak'},
        {value: 'sv-SE', label: 'Swedish'},
        {value: 'tr-TR', label: 'Turkish'},
        {value: 'zh-CN', label: '简体中文'},
        {value: 'zh-TW', label: '繁體中文'},
      ],
    },
  ],
  streaming: [
    {
      name: 'resolution',
      type: 'radio',
      title: t('Resolution'),
      description: t('Set resolution, support 720P/1080P'),
      data: [
        {value: 720, label: '720P'},
        {value: 1080, label: '1080P'},
      ],
    },
    {
      name: 'video_format',
      type: 'select',
      title: t('Video stream format'),
      description: t(
        'Select video stream format, if you want video fullscreen, please select Stretch or Zoom',
      ),
      data: [
        {value: '', label: t('Aspect ratio')},
        {value: 'Stretch', label: t('Stretch')},
        {value: 'Zoom', label: t('Zoom')},
      ],
    },
    {
      name: 'codec',
      type: 'select',
      title: t('Codec'),
      description: t(
        'If your device supports newer codecs, it can reduce the video bandwidth requirements',
      ),
      data: [
        {value: '', label: 'Auto'},
        // {value: 'video/AV1', label: 'AV1'},
        // {value: 'video/VP9', label: 'VP9'},
        {value: 'video/H265', label: 'H265'},
        // {value: 'video/VP8', label: 'VP8'},
        {value: 'video/H264-4d', label: 'H264-High'},
        {value: 'video/H264-42e', label: 'H264-Medium'},
        {value: 'video/H264-420', label: 'H264-Low'},
        // {value: 'video/flexfec-03', label: 'flexfec-03'},
        // {value: 'video/ulpfec', label: 'ulpfec'},
        // {value: 'video/rtx', label: 'rtx'},
        // {value: 'video/red', label: 'red'},
      ],
    },
    {
      name: 'xhome_bitrate',
      type: 'bitrate',
      title: t('Host stream bitrate'),
      description: t(
        'Set the host streaming bitrate (Note: Higher bitrate is not always better; the final bitrate will be determined by streaming negotiation)',
      )
    },
    {
      name: 'xcloud_bitrate',
      type: 'bitrate',
      title: t('Cloud stream bitrate'),
      description: t(
        'Set the cloud streaming bitrate (Note: Higher bitrate is not always better; the final bitrate will be determined by streaming negotiation)',
      )
    },
  ],
  gamepad: [
    {
      name: 'dead_zone',
      type: 'slider',
      min: 0.1,
      max: 0.9,
      step: 0.01,
      title: t('Joystick dead zone'),
      description: t('Config joystick dead zone'),
      data: [],
    },
    // {
    //   name: 'gamepad_kernal',
    //   type: 'select',
    //   title: t('Gamepad kernal'),
    //   description: t('Select gamepad kernal'),
    //   data: [
    //     {value: 'Native', label: 'Native'},
    //     {value: 'Web', label: 'Web'},
    //   ],
    // },
    {
      name: 'vibration',
      type: 'radio',
      title: t('Vibration'),
      description: t(
        'If your controller supports vibration, you can set whether it vibrates during the game',
      ),
      data: [
        {value: true, label: t('Enable')},
        {value: false, label: t('Disable')},
      ],
    },
  ],
  xhome: [
    {
      name: 'ipv6',
      type: 'radio',
      title: t('Ipv6'),
      description: t('Prioritize using IPv6 connection'),
      data: [
        {value: true, label: t('Enable')},
        {value: false, label: t('Disable')},
      ],
    },
    {
      name: 'signaling_home',
      type: 'select',
      title: t('Signal server') + '(xHome)',
      description: t(
        'The signaling server is a server for stream negotiation. If the host cannot connect, please try modifying this option',
      ),
      data: [],
    },
  ],
  xcloud: [
    {
      name: 'force_region_ip',
      type: 'select',
      title: t('Set region'),
      needRestart: true,
      description: t(
        'Changing the region allows you to use XGPU services without a proxy',
      ),
      data: [
        {value: '', label: t('Default')},
        {value: '203.41.44.20', label: t('Australia')},
        {value: '200.221.11.101', label: t('Brazil')},
        {value: '194.25.0.68', label: t('Europe')},
        {value: '210.131.113.123', label: t('Japan')},
        {value: '168.126.63.1', label: t('Korea')},
        {value: '4.2.2.2', label: t('United States')},
      ],
    },
    {
      name: 'signaling_cloud',
      type: 'select',
      title: t('Signal server') + '(xCloud)',
      description: t(
        'The signaling server is a server for stream negotiation. If the host cannot connect, please try modifying this option',
      ),
      data: [],
    },
  ]
}

export default settings