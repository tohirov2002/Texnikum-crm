# MET Texnikum — React Native (Expo)

## O'rnatish

```bash
npm install
```

## Ishga tushirish

```bash
npx expo start
```

## .env sozlash

`.env` faylida backend IP manzilini o'zgartiring:
```
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000
```

## Tuzilma

```
app/
├── _layout.jsx          ← Root (Redux, i18n, auth guard)
├── (onboarding)/        ← Birinchi ochilganda
├── (auth)/login.jsx     ← Login (3 til)
└── (tabs)/
    ├── _layout.jsx      ← Bottom tabs (rol asosida)
    ├── settings.jsx     ← Barcha rollarga umumiy
    ├── founder/         ← Ta'sischi
    ├── director/        ← Direktor
    ├── admin/           ← Markaz Admini
    ├── teacher/         ← O'qituvchi
    └── student/         ← Talaba

src/
├── api/                 ← axios + barcha endpointlar
├── store/               ← Redux (auth, theme)
├── i18n/                ← uz, ru, en tarjimalar
├── theme/               ← light/dark tokenlar
├── components/ui/       ← Ava, Button, Input, Card ...
├── constants/           ← ROLES, LANGUAGES, ATT_STATUS
└── utils/               ← formatters
```
