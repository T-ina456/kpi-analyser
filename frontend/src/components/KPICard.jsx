export default function KPICard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-gray-600">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
