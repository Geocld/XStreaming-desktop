import {Card, CardHeader, CardBody, CardFooter, RadioGroup, Radio, Slider, Select, SelectItem} from "@nextui-org/react"
import { useSettings } from "../context/userContext"

const SettingItem = (props) => {
  const { settings, setSettings} = useSettings()
  // console.log('settings:', settings)
  const item = props.item || {}

  const defaultValue = settings[item.name]

  const handleChangeSetting = value => {
    const key = item.name
    console.log('key:', key)
    if (key) {
      setSettings({
        ...settings,
        [key]: value
      })
    }
  }
  return (
    <div className="setting-item">
      <Card>
        <CardBody>
          <div className="setting-title">{ item.title }</div>
          <div className="setting-description">{ item.description }</div>
          {
            item.type === 'select' && (
              <Select
                className="setting-select"
                labelPlacement={'outside-left'}
                label={item.title}
                defaultSelectedKeys={[defaultValue]}
                onChange={e => {
                  handleChangeSetting(e.target.value)
                }}
              >
                  {
                    item.data.map(i => {
                      return (
                        <SelectItem key={i.value}>
                          {i.label}
                        </SelectItem>
                      )
                    })
                  }
              </Select>
            )
          }

          {
            item.type === 'radio' && (
              <RadioGroup 
                orientation="horizontal" 
                defaultValue={defaultValue}
                onValueChange={value => {
                  handleChangeSetting(value)
                }}
              >
                {
                  item.data.map(i => {
                    return (
                      <Radio value={i.value} key={i.value}>{i.label}</Radio>
                    )
                  })
                }
              </RadioGroup>
            )
          }

          {
            item.type === 'slider' && (
              <Slider
                className="setting-slider"
                size="sm"
                label="Temperature" 
                step={item.step} 
                maxValue={item.max} 
                minValue={item.min} 
                defaultValue={defaultValue}
                onChange={value => {
                  handleChangeSetting(value)
                }}
              />
            )
          }
        </CardBody>
      </Card>
    </div>
  )
}

export default SettingItem