# Internationalization (i18n) Guide

## Overview
The application uses **react-i18next** for multi-language support. Currently supports:
- 🇺🇸 English (en) - Default
- 🇮🇳 Hindi (hi)

## Configuration

### Files
| File | Purpose |
|------|---------|
| `src/lib/i18n.ts` | i18next configuration |
| `public/locales/en/*.json` | English translations |
| `public/locales/hi/*.json` | Hindi translations |

### Namespaces
| Namespace | Usage |
|-----------|-------|
| `common` | Buttons, labels, messages, sidebar |
| `dashboard` | Dashboard page |
| `fees` | Fee collection, demand bills |
| `admissions` | Admissions module |
| `settings` | Settings pages |

---

## How to Add Translations

### 1. Add Translation Key
```json
// public/locales/en/common.json
{
  "buttons": {
    "newButton": "New Button"
  }
}

// public/locales/hi/common.json  
{
  "buttons": {
    "newButton": "नया बटन"
  }
}
```

### 2. Use in Component
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <Button>{t('buttons.newButton')}</Button>;
}
```

### 3. Multiple Namespaces
```tsx
const { t } = useTranslation(['fees', 'common']);

// Use namespace prefix
t('fees:title')
t('common:buttons.save')
```

---

## Language Switching

### Location
School Settings → Regional Settings → Language dropdown

### Programmatic
```tsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
i18n.changeLanguage('hi'); // Switch to Hindi
```

### Persistence
Language preference is stored in `localStorage` under key `app_language`.

---

## Current Translation Status

### ✅ Translated
- Sidebar menu (Layout.tsx)
- Dashboard (partial)

### 🔶 Ready (translation files exist, not applied)
- Fee Collection
- Demand Bills
- All common buttons/labels

### ❌ Not Started
- Admissions pages
- Settings pages (except language selector)
- Exam pages
- Other pages

---

## Adding New Language

1. Create folder: `public/locales/[lang-code]/`
2. Copy all JSON files from `public/locales/en/`
3. Translate all values
4. Update `src/lib/i18n.ts`:
   ```ts
   supportedLngs: ['en', 'hi', 'NEW_LANG'],
   ```
5. Add language option in `SchoolSettings.tsx`

---

## Best Practices

1. **Use descriptive keys**: `buttons.submit` not `btn1`
2. **Group related keys**: All buttons under `buttons`, labels under `labels`
3. **Use namespaces**: Separate translations by module
4. **Avoid hardcoding**: Always use `t('key')` for user-facing text
5. **Interpolation**: For dynamic content: `t('welcome', { name: userName })`

---

*Last Updated: January 13, 2026*
