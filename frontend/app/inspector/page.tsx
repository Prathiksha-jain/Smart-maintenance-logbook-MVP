import AppShell from "@/components/AppShell";
import DefectForm from "@/components/DefectForm";

export default function InspectorPage() {
  return (
    <AppShell
      title="Inspector Workspace"
      subtitle="Log defects with transcript input, browser audio recording, and image evidence."
    >
      <DefectForm />
    </AppShell>
  );
}
