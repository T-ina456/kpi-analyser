export default function KPIBuilder() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-2">Create KPI</h2>

      <select className="border p-2 w-full mb-2">
        <option>SUM</option>
        <option>AVG</option>
        <option>COUNT</option>
      </select>

      <input
        placeholder="Field name (e.g. revenue)"
        className="border p-2 w-full mb-2"
      />

      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Add KPI
      </button>
    </div>
  );
}
