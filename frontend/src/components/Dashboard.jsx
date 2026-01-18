import FileUpload from "./FileUpload";
import KPIBuilder from "./KPIBuilder";
import KPICard from "./KPICard";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">📊 KPI Analyser</h1>

      <FileUpload />
      <KPIBuilder />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Revenue" value="₹2,050" />
        <KPICard title="Avg Order Value" value="₹683" />
        <KPICard title="Total Orders" value="3" />
      </div>
    </div>
  );
}
