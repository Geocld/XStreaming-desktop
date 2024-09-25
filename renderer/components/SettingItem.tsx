import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  RadioGroup,
  Radio,
  Slider,
  Autocomplete,
  AutocompleteItem,
} from "@nextui-org/react";
import { useTranslation } from "next-i18next";
import { useSettings } from "../context/userContext";
import Ipc from "../lib/ipc";

const SettingItem = (props) => {
  const { settings, setSettings } = useSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const item = props.item || {};
  const { t } = useTranslation('settings');

  const [defaultValue, setDefaultValue] = useState(settings[item.name]);

  useEffect(() => {
    if (item.name === 'theme') {
      const localTheme = localStorage.getItem('theme') || 'dark'
      console.log('localTheme:', localTheme)
      setDefaultValue(localTheme)
    } else {
      setDefaultValue(settings[item.name])
    }
    
    if (item.name === "signaling_cloud" || item.name === "signaling_home") {
      const method =
        item.name === "signaling_cloud" ? "getXcloudToken" : "getXhomeToken";
      Ipc.send("xCloud", method).then((data) => {
        if (data) {
          const regions = data.offeringSettings.regions;

          item.data = regions.map((region) => {
            if (region.isDefault) {
              setDefaultValue(region.name);
            }
            return {
              value: region.name,
              label: region.name,
            };
          });
        } else {
          item.data = [];
        }
        // console.log('item:', item)
      });
    }
  }, [item, settings]);

  const handleChangeSetting = (value) => {
    console.log("handleChangeSetting:", value);
    const key = item.name;
    if (key) {
      if (item.name === "signaling_cloud" || item.name === "signaling_home") {
        const method =
          item.name === "signaling_cloud"
            ? "setXcloudTokenDefault"
            : "setXhomeTokenDefault";
        Ipc.send("xCloud", method, value);
      } else if (key === 'theme') {
        localStorage.setItem('theme', value)
      } else {
        setSettings({
          ...settings,
          [key]: value,
        });
        if (item.needRestart) {
          props.onRestartWarn && props.onRestartWarn()
        }
      }
    }
    setDefaultValue(value);
  };

  return (
    <div className="setting-item">
      <Card>
        <CardBody>
          <div className="setting-title">{item.title}</div>
          <div className="setting-description">{item.description}</div>
          {item.type === "select" && defaultValue !== undefined && (
            <Autocomplete
              className="setting-select"
              labelPlacement={"outside-left"}
              label={item.title}
              selectedKey={defaultValue}
              isClearable={false}
              onSelectionChange={(value) => {
                handleChangeSetting(value);
              }}
            >
              {item.data.map((i) => {
                return (
                  <AutocompleteItem key={i.value}>{i.label}</AutocompleteItem>
                );
              })}
            </Autocomplete>
          )}

          {item.type === "radio" && (
            <RadioGroup
              orientation="horizontal"
              value={defaultValue}
              onValueChange={(value) => {
                handleChangeSetting(value);
              }}
            >
              {item.data.map((i) => {
                return (
                  <Radio value={i.value} key={i.value}>
                    {i.label}
                  </Radio>
                );
              })}
            </RadioGroup>
          )}

          {item.type === "slider" && (
            <Slider
              className="setting-slider"
              size="sm"
              label="slider"
              step={item.step}
              maxValue={item.max}
              minValue={item.min}
              defaultValue={defaultValue}
              onChange={(value) => {
                handleChangeSetting(value);
              }}
            />
          )}

          {item.type === "bitrate" && (
            <div>
              <RadioGroup
                defaultValue={settings[item.name + "_mode"]}
                onValueChange={(value) => {
                  setSettings({
                    ...settings,
                    [item.name + "_mode"]: value,
                  });
                }}
              >
                <Radio value="Auto">{t('Auto')}</Radio>
                <Radio value="Custom">{t('Custom')}</Radio>
              </RadioGroup>

              {settings[item.name + "_mode"] === "Custom" && (
                <Slider
                  className="setting-slider"
                  size="sm"
                  label="bitrate"
                  step={1}
                  maxValue={50}
                  minValue={1}
                  defaultValue={defaultValue}
                  onChange={(value) => {
                    handleChangeSetting(value);
                  }}
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default SettingItem;
