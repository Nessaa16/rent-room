"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { GraduationCap, UserRoundCog } from "lucide-react";

type JenisAkun = "mahasiswa" | "dosen";

interface PeminjamItem {
  id: number;
  nama: string;
  nimNik?: string | null;
  email?: string | null;
  telp?: string | null;
  fakultas?: string | null;
  jenisAkun: JenisAkun;
  createdAt: string;
}

const EMPTY_FORM = {
  nama: "",
  nimNik: "",
  email: "",
  telp: "",
  fakultas: "",
  jenisAkun: "mahasiswa" as JenisAkun,
};

export default function PeminjamPage() {
  const [list, setList] = useState<PeminjamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/peminjam")
      .then((res) => res.json())
      .then((data) => { if (data.success) setList(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = useMemo(() => form.nama.trim().length > 0, [form.nama]);

  function startEdit(item: PeminjamItem) {
    setEditingId(item.id);
    setForm({
      nama: item.nama,
      nimNik: item.nimNik ?? "",
      email: item.email ?? "",
      telp: item.telp ?? "",
      fakultas: item.fakultas ?? "",
      jenisAkun: item.jenisAkun,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    const url = editingId ? `/api/peminjam/${editingId}` : "/api/peminjam";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();

    if (data.success) {
      if (editingId) {
        setList((cur) => cur.map((item) => (item.id === editingId ? data.data : item)));
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

  async function handleDelete(id: number) {
    if (!confirm("Hapus peminjam ini? Semua data peminjaman terkait juga akan terpengaruh.")) return;
    setDeletingId(id);
    const response = await fetch(`/api/peminjam/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (data.success) {
      setList((cur) => cur.filter((item) => item.id !== id));
    } else {
      alert(data.message || "Gagal menghapus.");
    }
    setDeletingId(null);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Data Peminjam</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola identitas peminjam ruang dan peralatan.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit Peminjam" : "Tambah Peminjam Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nama Lengkap <span className="text-red-500">*</span>
              <input
                value={form.nama}
                onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: Siti Nurjanah"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {form.jenisAkun === "mahasiswa" ? "NIM" : "NIK / NIP"}
              <input
                value={form.nimNik}
                onChange={(e) => setForm((prev) => ({ ...prev, nimNik: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder={form.jenisAkun === "mahasiswa" ? "2024XXXXXX" : "3271XXXXXXXXXX"}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Nomor HP
              <input
                value={form.telp}
                onChange={(e) => setForm((prev) => ({ ...prev, telp: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="0812xxxxxxx"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="email@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Fakultas / Unit
              <input
                value={form.fakultas}
                onChange={(e) => setForm((prev) => ({ ...prev, fakultas: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Teknik Informatika"
              />
            </label>

            <div className={`grid gap-2 ${editingId ? "grid-cols-2" : "grid-cols-1"}`}>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Peminjam"}
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Peminjam</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {list.length} orang
            </span>
          </div>

          {loading ? (
            <div className="mt-6"><Spinner /></div>
          ) : list.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
              Belum ada data peminjam.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
              <div className="hidden grid-cols-[1fr_120px_160px_80px] gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:grid">
                <span>Identitas</span>
                <span>Jenis</span>
                <span>Kontak</span>
                <span></span>
              </div>
              <div className="divide-y divide-slate-100">
                {list.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 px-6 py-4 text-sm text-slate-700 sm:grid-cols-[1fr_120px_160px_80px] sm:items-center sm:gap-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.nama}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.nimNik || "-"} · {item.fakultas || "-"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.jenisAkun === "dosen"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                        }`}
                    >
                      {item.jenisAkun === "dosen" ? "Dosen" : "Mahasiswa"}
                    </span>
                    <div className="space-y-0.5 text-xs text-slate-500">
                      <p>{item.email || "—"}</p>
                      <p>{item.telp || "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-orange-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
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