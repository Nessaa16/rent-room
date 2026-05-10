"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface RuangItem {
  id: number;
  nama: string;
  gedung?: string | null;
  lantai?: string | null;
  kapasitas: number;
  status: "TERSEDIA" | "DIGUNAKAN";
}

const EMPTY_FORM = { nama: "", gedung: "", lantai: "", kapasitas: "" };

export default function RuangPage() {
  const [list, setList] = useState<RuangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/ruang")
      .then((res) => res.json())
      .then((data) => { if (data.success) setList(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = useMemo(
    () => form.nama.trim().length > 0 && Number(form.kapasitas) > 0,
    [form.nama, form.kapasitas]
  );

  function startEdit(item: RuangItem) {
    setEditingId(item.id);
    setForm({
      nama: item.nama,
      gedung: item.gedung ?? "",
      lantai: item.lantai ?? "",
      kapasitas: String(item.kapasitas),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    const url = editingId ? `/api/ruang/${editingId}` : "/api/ruang";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, kapasitas: Number(form.kapasitas) }),
    });
    const data = await res.json();

    if (data.success) {
      if (editingId) {
        setList((cur) => cur.map((r) => r.id === editingId ? data.data : r));
        setEditingId(null);
      } else {
        setList((cur) => [data.data, ...cur]);
      }
      setForm(EMPTY_FORM);
    } else {
      alert(data.message || "Terjadi kesalahan.");
    }
    setSaving(false);
  }

  async function handleToggleStatus(id: number) {
    setTogglingId(id);
    const res = await fetch(`/api/ruang/${id}`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      setList((cur) => cur.map((r) => r.id === id ? data.data : r));
    } else {
      alert(data.message || "Gagal mengubah status.");
    }
    setTogglingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus ruang ini?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/ruang/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setList((cur) => cur.filter((r) => r.id !== id));
    } else {
      alert(data.message || "Gagal menghapus ruang.");
    }
    setDeletingId(null);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Data Ruang</h1>
        <p className="mt-1 text-sm text-slate-500">Atur ruangan yang dapat dipinjam oleh pengguna.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit Ruang" : "Tambah Ruang Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nama Ruang <span className="text-red-500">*</span>
              <input
                value={form.nama}
                onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: Ruang Sidang A"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Gedung
                <input
                  value={form.gedung}
                  onChange={(e) => setForm((p) => ({ ...p, gedung: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Gedung A"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Lantai
                <input
                  value={form.lantai}
                  onChange={(e) => setForm((p) => ({ ...p, lantai: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="3"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Kapasitas <span className="text-red-500">*</span>
              <input
                value={form.kapasitas}
                onChange={(e) => setForm((p) => ({ ...p, kapasitas: e.target.value }))}
                type="number"
                min="1"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="30"
              />
            </label>

            <div className={`grid gap-2 ${editingId ? "grid-cols-2" : "grid-cols-1"}`}>
              {editingId && (
                <button type="button" onClick={cancelEdit}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Batal
                </button>
              )}
              <button type="submit" disabled={!canSubmit || saving}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Ruang"}
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Ruang</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {list.length} ruang
            </span>
          </div>

          {loading ? (
            <div className="mt-6"><Spinner /></div>
          ) : list.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">Belum ada data ruang.</div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
              <div className="hidden grid-cols-[1fr_140px_90px_120px_100px] gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:grid">
                <span>Nama</span>
                <span>Lokasi</span>
                <span>Kapasitas</span>
                <span>Status</span>
                <span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {list.map((item) => (
                  <div key={item.id}
                    className="grid grid-cols-1 gap-3 px-6 py-4 text-sm text-slate-700 sm:grid-cols-[1fr_140px_90px_120px_100px] sm:items-center sm:gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{item.nama}</p>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {[item.gedung, item.lantai ? `Lt. ${item.lantai}` : null].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p>{item.kapasitas} orang</p>

                    {/* Toggle status */}
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      disabled={togglingId === item.id}
                      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium transition border ${
                        item.status === "TERSEDIA"
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      } disabled:opacity-50`}
                    >
                      {togglingId === item.id ? "..." : item.status === "TERSEDIA" ? "✅ Tersedia" : "🔴 Digunakan"}
                    </button>

                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50">
                        {deletingId === item.id ? "..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}