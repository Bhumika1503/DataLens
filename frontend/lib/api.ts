const API_URL = "http://127.0.0.1:8000";


async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    options
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `Request failed: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}


export type HealthResponse = {
  backend: string;
  supabase: string;
};


export type Dataset = {
  id: string;
  name: string;
  description: string | null;
  source_type: string;
  source_location: string | null;
  schema_version: number;
  status: string;
  created_at: string;
  updated_at: string;
};


export type DatasetsResponse = {
  datasets: Dataset[];
};


export function getHealth() {
  return request<HealthResponse>("/api/health");
}


export function getDatasets() {
  return request<DatasetsResponse>("/api/datasets");
}


export function uploadDataset(
  name: string,
  file: File
) {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("file", file);

  return request<{
    success: boolean;
    dataset: Dataset;
  }>("/api/datasets", {
    method: "POST",
    body: formData,
  });
}
export function importDatasetFromURL(
  name: string,
  url: string
) {
  return request<{
    success: boolean;
    dataset: Dataset;
  }>("/api/datasets/import-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, url }),
  });
}