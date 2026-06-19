# PagoHelper — Contexto del Proyecto

## ¿Qué es?
App React Native (v3) para pagos vía WebView con catálogo de items, cola de compras, región y soporte TV.

## Stack
- React Native 0.79.x + TypeScript
- React Navigation
- lucide-react-native 1.21.0 (iconos SVG)
- AsyncStorage, WebView (react-native-webview)
- Zustand (stores: usePaymentStore, usePurchaseStore, useAppStore)
- pnpm con store-dir `E:\laragon\tmp\pnpm-store`

## Git
- Remote: `https://github.com/Francis-play/pagostore-wrapper.git`
- Branch activa: `fix/login-and-queue-unification`
- Default: `main`
- **⚠️ Pendiente: commit + push** — ~30 archivos modificados sin commit (toda la migración)

---

## Lo que se hizo (sesiones con IA)

### 1. Migración completa a sistema de tokens + Icon
- Creado `src/theme/tokens.ts` con colores, spacings, radii, font, shadow.
- Creado `src/components/Icon.tsx` — mapea 18 nombres de iconos a componentes lucide-react-native.
- Migradas 9 pantallas eliminando strings de color hardcodeados y `<Text>` con símbolos:
  - `HomeScreen`, `SettingsScreen`, `CheckoutScreen`
  - `ItemsScreen`, `BatchPaymentScreen`, `ItemCatalogScreen`
  - `ProcessingScreen`, `ResultScreen`, `PinScreen`
- Eliminados todos los `<Icon>`-dentro-de-`<Text>` (lucide renderiza SVG, no anidable).
- Agregado `StyleSheet` faltante en `SettingsScreen`.
- TypeScript compila limpio (3 errores pre-existentes no relacionados: jest types, JS module import, queue type).

### 2. Instalación de lucide-react-native
- Instalado `lucide-react-native@1.21.0` vía pnpm.
- Verificados exports de `Diamond`, `Settings`, `X`, `Check`, `ArrowLeft`, etc. en ESM (`dist/esm/lucide-react-native.mjs`) y CJS.

### 3. Backup y restauración
- Backup de `src/` en `_backup_PagoHelper_src/`.
- Se restauraron archivos desde backup en un punto del proceso.

### 4. Estructura actual de src/
```
src/
  components/   Card, Icon, Item, Section
  config/       regions.ts
  context/      WebViewContext.tsx
  core/         paymentController.ts, purchaseQueue.ts
  navigation/   RootNavigator.tsx
  purchase/     purchaseSdk.ts
  screens/      Home, BatchPayment, Checkout, ItemCatalog, Items, Pin, Processing, Result, Settings
  security/     cardStore.ts
  services/     api.ts
  store/        usePaymentStore, useAppStore, usePurchaseStore
  theme/        tokens.ts
  types/        index.ts
  utils/        helpers.ts
  webview/      injected.js
```

---

## Pendiente
1. **⚠️ Commit + Push a origin** — ~30 archivos modificados (App.tsx, screens, store, webview, etc.)
2. Verificar que `Icon.tsx` compile y renderice correctamente con lucide-react-native 1.x.
3. Correr la app en emulador/dispositivo para validar todos los iconos.
4. Los 3 errores pre-existentes de TypeScript no bloquean pero deberían corregirse eventualmente:
   - `__tests__/App.test.tsx:9` — agregar `@types/jest`
   - `src/context/WebViewContext.tsx:4` — declarar módulo para `.js`
   - `src/core/paymentController.ts:23` — corregir tipo QueueItem

## Recurrente
- Después de cada sesión de trabajo: `git add -A; git commit -m "..." ; git push origin fix/login-and-queue-unification`
- Ejecutar `pnpm tsc --noEmit` antes de commit para verificar types
