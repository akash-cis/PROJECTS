import i18n from "i18next"
import { initReactI18next } from "react-i18next"

// Move to its own file
// https://react.i18next.com/latest/using-with-hook
const resources = {
  en: {
    translation: {
      labels: {
        locality: "City",
        region: "State",
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "en",
  debug: false,
})

export default i18n
