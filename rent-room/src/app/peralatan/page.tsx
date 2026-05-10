"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface PeralatanItem {
  id: number;
  kode: string;
  nama: string;
  kategori?: string | null;
  jumlah: number;
  status: "TERSEDIA" | "RUSAK";
}

const EMPTY_FORM = { kode: "", nama: "", kategori: "", jumlah: "1" };

export default function PeralatanPage() {
  const [list, setList] = useState<PeralatanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/peralatan")
      .then((res) => res.json())
      .then((data) => { if (data.success) setList(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = useMemo(
    () => form.kode.trim().length > 0 && form.nama.trim().length > 0 && Number(form.jumlah) > 0,
    [form.kode, form.nama, form.jumlah]
  );

  function startEdit(item: PeralatanItem) {
    setEditingId(item.id);
    setForm({
      kode: item.kode,
      nama: item.nama,
      kategori: item.kategori ?? "",
      jumlah: String(item.jumlah),
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

    const url = editingId ? `/api/peralatan/${editingId}` : "/api/peralatan";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, jumlah: Number(form.jumlah) }),
    });
    const data = await res.json();

    if (data.success) {
      if (editingId) {
        setList((cur) => cur.map((p) => p.id === editingId ? data.data : p));
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
    const res = await fetch(`/api/peralatan/${id}`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      setList((cur) => cur.map((p) => p.id === id ? data.data : p));
    } else {
      alert(data.message || "Gagal mengubah status.");
    }
    setTogglingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus peralatan ini?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/peralatan/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setList((cur) => cur.filter((p) => p.id !== id));
    } else {
      alert(data.message || "Gagal menghapus peralatan.");
    }
    setDeletingId(null);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Data Peralatan</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola peralatan yang dapat dipinjam beserta stok dan kategorinya.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit Peralatan" : "Tambah Peralatan Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            <label className="block text-sm font-medium text-slate-700">
              Kode Peralatan <span className="text-red-500">*</span>
              <input
                value={form.kode}
                onChange={(e) => setForm((p) => ({ ...p, kode: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 uppercase"
                placeholder="PRY-001"
              />
              <span className="mt-1 text-xs text-slate-400">Otomatis diubah ke huruf kapital</span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Nama Peralatan <span className="text-red-500">*</span>
              <input
                value={form.nama}
                onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Proyektor Epson"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Kategori
              <input
                value={form.kategori}
                onChange={(e) => setForm((p) => ({ ...p, kategori: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Audio, Visual, Furnitur, dll."
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Jumlah Stok <span className="text-red-500">*</span>
              <input
                value={form.jumlah}
                onChange={(e) => setForm((p) => ({ ...p, jumlah: e.target.value }))}
                type="number"
                min="1"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="5"
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
                className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300">
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Peralatan"}
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Peralatan</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {list.length} item
            </span>
          </div>

          {loading ? (
            <div className="mt-6"><Spinner /></div>
          ) : list.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">Belum ada data peralatan.</div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
              <div className="hidden grid-cols-[80px_1fr_120px_70px_110px_90px] gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:grid">
                <span>Kode</span>
                <span>Nama</span>
                <span>Kategori</span>
                <span>Stok</span>
                <span>Status</span>
                <span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {list.map((item) => (
                  <div key={item.id}
                    className="grid grid-cols-1 gap-3 px-6 py-4 text-sm text-slate-700 sm:grid-cols-[80px_1fr_120px_70px_110px_90px] sm:items-center sm:gap-4">

                    <span className="font-mono text-xs font-semibold text-slate-500">{item.kode}</span>

                    <p className="font-medium text-slate-900">{item.nama}</p>

                    <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                      {item.kategori || "—"}
                    </span>

                    <p className="text-slate-700">{item.jumlah} unit</p>

                    {/* Toggle status */}
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      disabled={togglingId === item.id}
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                        item.status === "TERSEDIA"
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      } disabled:opacity-50`}
                    >
                      {togglingId === item.id ? "..." : item.status === "TERSEDIA" ? "Tersedia" : "Rusak"}
                    </button>

                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-400">
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