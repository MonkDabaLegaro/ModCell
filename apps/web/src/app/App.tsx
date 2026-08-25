import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { ApplicationsPage } from "../features/applications/ApplicationsPage";
import { DiagnosticsPage } from "../features/diagnostics/DiagnosticsPage";
import { FilesPage } from "../features/files/FilesPage";
import { OverviewPage } from "../features/overview/OverviewPage";
import { ScreenControlPage } from "../features/screen/ScreenControlPage";
import type { NavigationId } from "./navigation";

export function App() {
  const [active, setActive] = useState<NavigationId>("overview");
  const page = active === "files" ? <FilesPage /> : active === "applications" ? <ApplicationsPage /> : active === "diagnostics" ? <DiagnosticsPage /> : active === "screen" ? <ScreenControlPage /> : <OverviewPage />;
  return <AppShell active={active} onNavigate={setActive}>{page}</AppShell>;
}
