import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { FilesPage } from "../features/files/FilesPage";
import { OverviewPage } from "../features/overview/OverviewPage";
import type { NavigationId } from "./navigation";

export function App() {
  const [active, setActive] = useState<NavigationId>("overview");
  return <AppShell active={active} onNavigate={setActive}>{active === "files" ? <FilesPage /> : <OverviewPage />}</AppShell>;
}
