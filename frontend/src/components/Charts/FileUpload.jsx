export default function FileUpload() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-2">Upload Dataset</h2>
      <input type="file" className="border p-2 w-full" />
      <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
        Upload
      </button>
    </div>
  );
}
