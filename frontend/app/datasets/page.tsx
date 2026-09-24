"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getDatasets,
  uploadDataset,
} from "@/lib/api";


type Dataset = {
  id: string;
  name: string;
  source_type: string;
  status: string;
  created_at: string;
};


export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");


  async function loadDatasets() {
    try {
      setError("");

      const data = await getDatasets();

      setDatasets(data.datasets);

    } catch (err) {
      console.error(err);

      setError(
        "Backend se connect nahi ho pa raha."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDatasets();
  }, []);


  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);

    if (!name) {
      setName(
        selectedFile.name.replace(
          /\.[^/.]+$/,
          ""
        )
      );
    }
  }


  async function handleUpload(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!file || !name) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadDataset(name, file);

      setName("");
      setFile(null);

      await loadDatasets();

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Upload failed"
      );

    } finally {
      setUploading(false);
    }
  }


  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">

      <div className="mx-auto max-w-5xl">

        <h1 className="text-4xl font-bold">
          Dataset Manager
        </h1>

        <p className="mt-2 text-slate-400">
          Add and manage your datasets.
        </p>


        {error && (
          <div className="mt-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}


        <form
          onSubmit={handleUpload}
          className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >

          <input
            type="text"
            placeholder="Dataset name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full rounded-lg bg-slate-800 p-3 outline-none"
          />


          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            className="mt-4 w-full"
          />


          <button
            type="submit"
            disabled={
              uploading ||
              !file ||
              !name
            }
            className="mt-5 rounded-lg bg-white px-5 py-3 font-semibold text-black disabled:opacity-40"
          >
            {uploading
              ? "Uploading..."
              : "Upload Dataset"}
          </button>

        </form>


        <section className="mt-10">

          <h2 className="text-2xl font-semibold">
            Your Datasets
          </h2>


          {loading ? (
            <p className="mt-5 text-slate-400">
              Loading datasets...
            </p>
          ) : (
            <div className="mt-5 space-y-3">

              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >

                  <div className="flex justify-between">

                    <div>
                      <h3 className="font-semibold">
                        {dataset.name}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {dataset.source_type}
                      </p>
                    </div>

                    <span className="text-green-400">
                      {dataset.status}
                    </span>

                  </div>

                </div>
              ))}


              {datasets.length === 0 && (
                <p className="text-slate-500">
                  No datasets yet.
                </p>
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}