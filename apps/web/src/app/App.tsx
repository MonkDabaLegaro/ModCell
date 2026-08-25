import { AppShell } from "../components/layout/AppShell";
import { OverviewPage } from "../features/overview/OverviewPage";

export function App() {
  return (
    <AppShell>
      <OverviewPage />
    </AppShell>
  );
}
