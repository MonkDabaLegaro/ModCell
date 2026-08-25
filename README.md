# ModCell

ModCell is a local Android control laboratory. Connect an Android phone over USB, authorize ADB, and the local control plane discovers the device, profiles supported capabilities, and exposes them through a passive dark-forest web dashboard.

The project intentionally separates Android control from presentation. The web UI can be replaced or redesigned without rewriting the ADB/domain layers.

## Current vertical slice

- Detect Android devices with `adb devices -l`.
- Distinguish authorized, unauthorized and offline states.
- Profile manufacturer, model, Android version, SDK, ABI and battery.
- Detect whether a privileged `su` shell is available.
- Resolve a capability matrix instead of assuming features by manufacturer.
- Expose a localhost-only Fastify API.
- Automatically refresh the React dashboard when a USB device appears.
- Keep visual design behind CSS design tokens for inexpensive redesigns.
- Provide a guarded reboot endpoint as the first device action.

## Architecture

```text
apps/
  daemon/             Local HTTP control plane
  web/                React/Vite laboratory dashboard

packages/
  android-bridge/     Process execution + ADB adapter
  contracts/          Shared API/domain contracts
  device-domain/      Device profiling + capability policy
```

Dependencies point inward: `web` and `daemon` consume contracts; Android-specific execution lives behind `android-bridge`; device interpretation lives in `device-domain`.

## Requirements

- Node.js 22+
- pnpm 10+
- Android Platform Tools (`adb`) available in PATH, or `MODCELL_ADB_PATH` configured
- Android device with USB debugging enabled

ModCell no longer requires checked-in Windows copies of Platform Tools or scrcpy. External tools are runtime dependencies and will be handled by platform-aware tooling as that module grows.

## Development

```bash
pnpm install
pnpm dev
```

Then open `http://127.0.0.1:5173`.

The daemon listens on `http://127.0.0.1:4317` by default. The Vite development server proxies `/api` to it.

### Optional configuration

Copy `.env.example` values into your shell/environment when needed:

```text
MODCELL_ADB_PATH=/absolute/path/to/adb
MODCELL_HOST=127.0.0.1
MODCELL_PORT=4317
```

## Design system

The UI uses semantic CSS variables in `apps/web/src/styles/tokens.css`. Components consume semantic tokens rather than hardcoded theme colors. Changing the forest-green identity later should primarily require editing that token layer.

Icons come from Lucide as SVG-based React components. Emojis are not used as interface iconography. See `THIRD_PARTY_NOTICES.md`.

## Safety model

ModCell is intended to control devices you own or are authorized to administer.

- The daemon binds to loopback by default.
- Browser access is restricted to localhost origins in development.
- ADB commands use argument arrays with `shell: false` rather than concatenated shell strings.
- Capabilities are detected before privileged functionality is exposed.
- Advanced/root/fastboot operations should live behind explicit capability and confirmation policies as those modules are added.

## Roadmap

1. Files and media explorer using scoped ADB push/pull operations.
2. Application inventory and package actions.
3. Diagnostics workspace with logcat and bugreport parsing.
4. scrcpy toolchain integration and screen control.
5. Storage analysis and cleanup jobs.
6. Platform-aware toolchain resolver for Windows, Linux and macOS.
7. Advanced/root and fastboot modules with explicit risk boundaries.

## Legacy prototype

The repository started as a PyQt proof of concept. The TypeScript monorepo is now the active architecture. Legacy files will be removed as their remaining behavior is either migrated or intentionally retired.
