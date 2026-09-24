"use client";

import { useEffect, useState } from "react";

import {
  getHealth,
  type HealthResponse,
} from "@/lib/api";


export default function Home() {
  const [health, setHealth] =
    useState<HealthResponse | null>(null);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealth(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);


  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">

      <div className="mx-auto max-w-5xl">

        <h1 className="text-5xl font-bold">
          DataLens
        </h1>

        <p className="mt-3 text-slate-400">
          AI-powered data intelligence platform
        </p>


        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            System Status
          </h2>


          {error && (
            <p className="mt-4 text-red-400">
              {error}
            </p>
          )}


          {health && (
            <div className="mt-5 space-y-3">

              <div className="flex justify-between">
                <span>Backend</span>

                <span className="text-green-400">
                  {health.backend}
                </span>
              </div>


              <div className="flex justify-between">
                <span>Supabase</span>

                <span className="text-yellow-400">
                  {health.supabase}
                </span>
              </div>

            </div>
          )}


          <a
            href="/datasets"
            className="mt-6 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-black"
          >
            Open Dataset Manager
          </a>

        </div>

      </div>

    </main>
  );
}