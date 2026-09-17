import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import uz from './uz';
import ru from './ru';
import en from './en';

// SecureStore dan saqlangan tilni olish (sinxron emas, shuning uchun default uz)
const getSavedLang = () => {
  try {
    // Expo SecureStore async, shuning uchun initial lang uz
    return 'uz';
  } catch {
    return 'uz';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    lng:          getSavedLang(),
    fallbackLng:  'uz',
    interpolation: { escapeValue: false },
  });

export const changeLang = async (code) => {
  await i18n.changeLanguage(code);
  await SecureStore.setItemAsync('met_lang', code);
};

export const loadSavedLang = async () => {
  try {
    const saved = await SecureStore.getItemAsync('met_lang');
    if (saved) await i18n.changeLanguage(saved);
  } catch {}
};

export default i18n;
