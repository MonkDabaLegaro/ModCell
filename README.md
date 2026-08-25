# ModCell

ModCell is a local Android control laboratory. Connect an Android phone over USB, authorize ADB, and the local control plane discovers the device, profiles supported capabilities, and exposes them through a passive dark-forest web dashboard.

The architecture intentionally separates device control, domain policy, transport, shared contracts and presentation. The web interface, theme, or even the frontend technology can be changed later without rewriting the Android core.

## Current vertical slice

- Detect Android devices with `adb devices -l`.
- Distinguish authorized, unauthorized and offline states.
- Profile manufacturer, model, Android version, SDK, ABI and battery.
- Detect whether a privileged `su` shell is available.
- Resolve a capability matrix instead of assuming features by manufacturer.
- Expose a localhost-only Fastify API.
- Automatically refresh the React dashboard when a USB device appears.
- Keep visual design behind semantic CSS tokens for inexpensive redesigns.
- Provide a guarded reboot endpoint as the first device action.

## Monorepo architecture

```text
apps/
  daemon/             Local HTTP control plane and composition root
  web/                React/Vite laboratory dashboard

packages/
  android-bridge/     Process execution + ADB adapter
  contracts/          Shared API/domain contracts
  device-domain/      Device profiling + capability policy
```

### Dependency direction

```text
web ---------> contracts
                 ^
                 |
daemon ------> device-domain ------> android-bridge
   |                 |                    |
   +---------------->+------------------->contracts
```

`apps/daemon` is the composition root. Packages do not import the frontend or Fastify. Android process execution is replaceable through the `CommandRunner` interface, so tests and future transports do not require real subprocesses.

## Requirements

- Node.js 22+
- pnpm 10+
- Android Platform Tools (`adb`) available in PATH, or `MODCELL_ADB_PATH` configured
- Android device with USB debugging enabled

Platform Tools and scrcpy binaries are intentionally not committed. They are external runtime tools and will be handled through a platform-aware toolchain module rather than freezing Windows binaries in source control.

## Development

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173`.

The daemon listens on `http://127.0.0.1:4317` by default. Vite proxies `/api` to it during development.

### Optional configuration

```text
MODCELL_ADB_PATH=/absolute/path/to/adb
MODCELL_HOST=127.0.0.1
MODCELL_PORT=4317
```

## Frontend modularity

The presentation layer is split into application navigation, API adapters, reusable UI components, feature modules and theme tokens:

```text
apps/web/src/
  api/
  app/
  components/
    layout/
    ui/
  features/
    overview/
  hooks/
  styles/
    tokens.css
    global.css
```

The forest-green identity lives primarily in `styles/tokens.css`. Components use semantic variables such as `--color-bg-surface`, `--color-border` and `--color-text-primary`, so a future visual redesign does not require editing each feature component.

The UI uses Lucide's SVG-based React icons; no emoji iconography is used. See `THIRD_PARTY_NOTICES.md`.

## Local safety boundaries

ModCell is intended for devices you own or are authorized to administer.

- The daemon binds to loopback by default.
- Browser access is restricted to localhost origins in development.
- ADB commands use argument arrays with `shell: false`; user-controlled values are not concatenated into shell command strings.
- Device capability detection precedes privileged features.
- Root and future fastboot functionality belongs behind explicit capability and confirmation policies.

## Roadmap

1. Files and media explorer using scoped ADB push/pull operations.
2. Application inventory and package actions.
3. Diagnostics workspace with logcat and bugreport parsing.
4. scrcpy toolchain integration and screen control.
5. Storage analysis and cleanup jobs.
6. Platform-aware ADB/scrcpy resolver for Windows, Linux and macOS.
7. Advanced/root and fastboot modules with explicit risk boundaries.

## History

ModCell began as a small PyQt proof of concept. That implementation has been retired from the active tree after its useful concepts were migrated into the modular control-center architecture. Its history remains available through Git.
