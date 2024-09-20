import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from './languages/en'
import zh from './languages/zh'
import zht from './languages/zht'
import jp from './languages/jp'

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en,
  zh,
  zht,
  jp,
};

let lng = 'en'
console.log('global:', global)
if (global && global.localStorage) {
  console.log('global.localStorage.getItem:', global.localStorage.getItem('locale'))
  lng = global.localStorage.getItem('locale') || 'en'
}

console.log('lng:', lng)

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng,

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n