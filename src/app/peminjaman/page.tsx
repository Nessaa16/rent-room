"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

type StatusPengajuan = "menunggu" | "disetujui" | "ditolak" | "selesai";

interface OptionItem {
  id: number;
  nama: string;
}

interface PeralatanOption extends OptionItem {
  stok: number;
  kategori?: string | null;
  status: string;
}

interface RuangOption extends OptionItem {
  kapasitas?: number | null;
  lantai?: string | null;
  gedung?: string | null;
  tersedia: boolean;
}

interface PeminjamanPeralatan {
  peralatanId: number;
  jumlah: number;
  peralatan: OptionItem;
}

interface PeminjamanItem {
  id: number;
  peminjam: OptionItem & { jenisAkun: string; nimNik?: string | null };
  ruang: RuangOption;
  peralatanList: PeminjamanPeralatan[];
  tanggalPakai: string;
  durasiJam: number;
  status: StatusPengajuan;
  waktuPengembalianAktual?: string | null;
  catatanPenolakan?: string | null;
  keperluan?: string | null;
  catatan?: string | null;
  createdAt: string;
}

interface SelectedPeralatan {
  peralatanId: string;
  jumlah: number;
}

type ModalAction = "disetujui" | "ditolak" | "selesai";

interface ModalState {
  open: boolean;
  item: PeminjamanItem | null;
  action: ModalAction | null;
  catatanPenolakan: string;
  waktuPengembalianAktual: string;
}

const MODAL_INIT: ModalState = {
  open: false,
  item: null,
  action: null,
  catatanPenolakan: "",
  waktuPengembalianAktual: "",
};

const EMPTY_FORM = {
  peminjamId: "",
  ruangId: "",
  tanggalPakai: "",
  durasiJam: "1",
  keperluan: "",
  catatan: "",
};

const STATUS_LABELS: Record<StatusPengajuan, string> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  selesai: "Selesai",
};

const STATUS_COLORS: Record<StatusPengajuan, string> = {
  menunggu: "bg-amber-50 text-amber-700 border-amber-200",
  disetujui: "bg-green-50 text-green-700 border-green-200",
  ditolak: "bg-red-50 text-red-700 border-red-200",
  selesai: "bg-slate-100 text-slate-600 border-slate-200",
};

const ACTION_LABELS: Record<ModalAction, string> = {
  disetujui: "Setujui Peminjaman",
  ditolak: "Tolak Peminjaman",
  selesai: "Tandai Selesai",
};

const ACTION_COLORS: Record<ModalAction, string> = {
  disetujui: "bg-green-600 hover:bg-green-700",
  ditolak: "bg-red-500 hover:bg-red-600",
  selesai: "bg-slate-700 hover:bg-slate-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function nowDatetimeLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export default function PeminjamanPage() {
  const [options, setOptions] = useState<{
    peminjam: (OptionItem & { jenisAkun: string; nimNik?: string | null })[];
    ruang: RuangOption[];
    peralatan: PeralatanOption[];
  }>({ peminjam: [], ruang: [], peralatan: [] });

  const [list, setList] = useState<PeminjamanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedPeralatan, setSelectedPeralatan] = useState<SelectedPeralatan[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusPengajuan | "semua">("semua");
  const [modal, setModal] = useState<ModalState>(MODAL_INIT);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [printTimestamp, setPrintTimestamp] = useState("");
  const [durasiError, setDurasiError] = useState<string | null>(null);
  const [tanggalError, setTanggalError] = useState<string | null>(null);
  const [roomAvailabilityError, setRoomAvailabilityError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPrintTimestamp(new Date().toLocaleString("id-ID")); }, []);

  useEffect(() => {
    if (!modal.open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModal(MODAL_INIT);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [modal.open]);

  useEffect(() => {
    if (!modal.open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(MODAL_INIT);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [modal.open]);

  // Validasi durasi saat form berubah
  useEffect(() => {
    if (form.durasiJam) {
      validateDurasi(form.durasiJam);
    }
  }, [form.durasiJam]);

  // Validasi tanggal tidak boleh masa lampau
  useEffect(() => {
    if (form.tanggalPakai) {
      validateTanggal(form.tanggalPakai);
    } else {
      setTanggalError(null);
      setRoomAvailabilityError(null);
    }
  }, [form.tanggalPakai]);

  useEffect(() => {
    async function checkRoomAvailability() {
      if (!form.ruangId || !form.tanggalPakai || tanggalError) {
        setRoomAvailabilityError(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/peminjaman/check?ruangId=${encodeURIComponent(form.ruangId)}&tanggalPakai=${encodeURIComponent(form.tanggalPakai)}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          setRoomAvailabilityError(data.message || "Ruang tidak tersedia.");
          return;
        }

        setRoomAvailabilityError(null);
      } catch (error) {
        console.error("Error checking room availability:", error);
        setRoomAvailabilityError("Gagal memeriksa ketersediaan ruangan.");
      }
    }

    checkRoomAvailability();
  }, [form.ruangId, form.tanggalPakai, tanggalError]);

  useEffect(() => {
    async function loadData() {
      try {
        const [optRes, listRes, authRes] = await Promise.all([
          fetch("/api/peminjaman/options"),
          fetch("/api/peminjaman"),
          fetch("/api/auth/verify"),
        ]);
        const safeJson = async (res: Response) => {
          if (!res.ok) { console.error("API error", res.status); return { success: false }; }
          try { return await res.json(); } catch { return { success: false }; }
        };
        const [optData, listData, authData] = await Promise.all([
          safeJson(optRes), safeJson(listRes), safeJson(authRes),
        ]);
        if (authData.success && authData.data?.user?.role) {
          setUserRole(authData.data.user.role);
        }
        if (optData.success) setOptions(optData.data);
        if (listData.success) setList(listData.data);
      } catch (error) {
        console.error("Failed loading peminjaman data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Validasi awal untuk durasi default
  useEffect(() => {
    validateDurasi(EMPTY_FORM.durasiJam);
  }, []);

  const stockError = useMemo(() => {
    for (const sel of selectedPeralatan) {
      if (!sel.peralatanId) continue;
      const opt = options.peralatan.find((p) => p.id === Number(sel.peralatanId));
      if (!opt) continue;
      if (opt.stok <= 0) {
        return `Stok "${opt.nama}" habis (stok: 0)`;
      }
      if (sel.jumlah <= 0) {
        return `Jumlah "${opt.nama}" harus lebih dari 0`;
      }
      if (sel.jumlah > opt.stok) {
        return `Stok "${opt.nama}" tidak cukup (tersedia: ${opt.stok}, diminta: ${sel.jumlah})`;
      }
    }
    return null;
  }, [selectedPeralatan, options.peralatan]);

  const canSubmit = useMemo(
    () => Boolean(
      form.peminjamId &&
      form.ruangId &&
      form.tanggalPakai &&
      Number(form.durasiJam) > 0 &&
      !stockError &&
      !durasiError &&
      !tanggalError &&
      !roomAvailabilityError
    ),
    [form, stockError, durasiError, tanggalError, roomAvailabilityError]
  );

  function validateTanggal(value: string) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setTanggalError("Tanggal peminjaman tidak boleh di masa lampau.");
      return false;
    }

    setTanggalError(null);
    return true;
  }

  function validateDurasi(value: string) {
    const numValue = Number(value);
    if (numValue <= 0) {
      setDurasiError("Durasi harus minimal 1 jam.");
      return false;
    }
    if (numValue > 24) {
      setDurasiError("Durasi maksimal 24 jam.");
      return false;
    }
    setDurasiError(null);
    return true;
  }

  function addPeralatanRow() {
    setSelectedPeralatan((prev) => [...prev, { peralatanId: "", jumlah: 1 }]);
  }
  function removePeralatanRow(index: number) {
    setSelectedPeralatan((prev) => prev.filter((_, i) => i !== index));
  }
  function updatePeralatanRow(index: number, field: keyof SelectedPeralatan, value: string | number) {
    setSelectedPeralatan((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const response = await fetch("/api/peminjaman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peminjamId: Number(form.peminjamId),
          ruangId: Number(form.ruangId),
          tanggalPakai: form.tanggalPakai,
          durasiJam: Number(form.durasiJam),
          keperluan: form.keperluan,
          catatan: form.catatan,
          peralatanList: selectedPeralatan
            .filter((p) => p.peralatanId)
            .map((p) => ({ peralatanId: Number(p.peralatanId), jumlah: p.jumlah })),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setList((cur) => [data.data, ...cur]);
        setForm(EMPTY_FORM);
        setSelectedPeralatan([]);
        setDurasiError(null);
      } else {
        alert(data.message || "Gagal membuat peminjaman.");
      }
    } finally {
      setSaving(false);
    }
  }

  function openModal(item: PeminjamanItem, action: ModalAction) {
    setModal({
      open: true,
      item,
      action,
      catatanPenolakan: "",
      waktuPengembalianAktual: action === "selesai" ? nowDatetimeLocal() : "",
    });
  }

  async function handleModalConfirm() {
    if (!modal.item || !modal.action) return;

    if (modal.action === "ditolak" && !modal.catatanPenolakan.trim()) {
      alert("Alasan penolakan wajib diisi.");
      return;
    }

    setSubmittingModal(true);
    try {
      const body: Record<string, string> = {
        status: modal.action.toUpperCase(),
      };
      if (modal.action === "ditolak") {
        body.catatanPenolakan = modal.catatanPenolakan.trim();
      }
      if (modal.action === "selesai" && modal.waktuPengembalianAktual) {
        body.waktuPengembalianAktual = new Date(modal.waktuPengembalianAktual).toISOString();
      }

      const response = await fetch(`/api/peminjaman/${modal.item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = response.ok ? await response.json() : { success: false, message: await response.text() };

      if (data.success) {
        const updatedStatus = modal.action.toLowerCase() as StatusPengajuan;
        setList((cur) =>
          cur.map((item) =>
            item.id === modal.item!.id
              ? {
                ...item,
                status: updatedStatus,
                waktuPengembalianAktual: data.data.waktuPengembalianAktual,
                catatanPenolakan: data.data.catatanPenolakan,
              }
              : item
          )
        );
        setModal(MODAL_INIT);
      } else {
        alert(data.message || "Gagal mengubah status.");
      }
    } finally {
      setSubmittingModal(false);
    }
  }

  function handleExport() {
    const filtered = filterStatus === "semua" ? list : list.filter((i) => i.status === filterStatus);
    const rows = [
      ["ID", "Peminjam", "Jenis", "NIM/NIK", "Ruang", "Peralatan", "Tanggal Pengajuan",
        "Tanggal Pakai", "Durasi (Jam)", "Status", "Waktu Pengembalian", "Catatan Penolakan",
        "Keperluan", "Catatan"],
      ...filtered.map((item) => [
        item.id, item.peminjam.nama, item.peminjam.jenisAkun, item.peminjam.nimNik ?? "-",
        item.ruang.nama,
        item.peralatanList.map((p) => `${p.peralatan.nama} (${p.jumlah})`).join("; ") || "-",
        formatDate(item.createdAt), formatDate(item.tanggalPakai), item.durasiJam, item.status,
        item.waktuPengembalianAktual ? formatDateTime(item.waktuPengembalianAktual) : "-",
        item.catatanPenolakan ?? "-", item.keperluan ?? "-", item.catatan ?? "-",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-peminjaman-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredList = filterStatus === "semua" ? list : list.filter((i) => i.status === filterStatus);
  const selectedRuang = options.ruang.find((r) => r.id === Number(form.ruangId));

  return (
    <div className="p-8 print:p-4">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Peminjaman</h1>
          <p className="mt-1 text-sm text-slate-500">Buat dan kelola peminjaman ruang serta peralatan.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
            Ekspor CSV
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Rekap Peminjaman</h1>
        <p className="text-sm text-gray-500">Dicetak: {printTimestamp}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] print:grid-cols-1">
        {/* Form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
          <h2 className="text-lg font-semibold text-slate-900">Buat Peminjaman</h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">

            <label className="block text-sm font-medium text-slate-700">
              Peminjam <span className="text-red-500">*</span>
              <select value={form.peminjamId}
                onChange={(e) => setForm((p) => ({ ...p, peminjamId: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">Pilih peminjam</option>
                {options.peminjam.map((item) => (
                  <option key={item.id} value={item.id}>{item.nama} ({item.jenisAkun})</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Ruang <span className="text-red-500">*</span>
              <select value={form.ruangId}
                onChange={(e) => setForm((p) => ({ ...p, ruangId: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">Pilih ruang</option>
                {options.ruang.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.tersedia}>
                    {item.nama}{item.gedung ? ` — ${item.gedung}` : ""}{item.lantai ? ` Lt.${item.lantai}` : ""}
                    {!item.tersedia ? " (tidak tersedia)" : ""}
                  </option>
                ))}
              </select>
              {selectedRuang && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Kapasitas: {selectedRuang.kapasitas ?? "—"} orang ·{" "}
                </p>
              )}
              {roomAvailabilityError && (
                <p className="mt-1.5 text-xs text-red-500">{roomAvailabilityError}</p>
              )}
            </label>

            {/* Peralatan multi-row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Peralatan (opsional)</p>
                <button type="button" onClick={addPeralatanRow}
                  className="text-xs font-medium text-orange-400 hover:text-blue-800">
                  + Tambah
                </button>
              </div>
              {selectedPeralatan.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada peralatan dipilih.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPeralatan.map((row, i) => {
                    const opt = options.peralatan.find((p) => p.id === Number(row.peralatanId));
                    const rowHasError = opt && (opt.stok <= 0 || row.jumlah > opt.stok || row.jumlah <= 0);
                    const rowErrorMsg = opt
                      ? opt.stok <= 0
                        ? `Stok habis (stok: 0)`
                        : row.jumlah <= 0
                        ? `Jumlah harus lebih dari 0`
                        : row.jumlah > opt.stok
                        ? `Stok tidak cukup (tersedia: ${opt.stok}, diminta: ${row.jumlah})`
                        : null
                      : null;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="grid grid-cols-[1fr_64px_28px] gap-2 items-center">
                          <select
                            value={row.peralatanId}
                            onChange={(e) => updatePeralatanRow(i, "peralatanId", e.target.value)}
                            className={`min-w-0 w-full rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 ${
                              rowHasError
                                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                            }`}
                          >
                            <option value="">Pilih peralatan</option>
                            {options.peralatan.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.status !== "TERSEDIA"}>
                                {p.nama}{p.kategori ? ` [${p.kategori}]` : ""} (stok: {p.stok})
                                {p.status !== "TERSEDIA" ? " — tidak tersedia" : ""}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={opt && opt.stok > 0 ? opt.stok : 1}
                            value={row.jumlah}
                            onChange={(e) => updatePeralatanRow(i, "jumlah", Number(e.target.value))}
                            disabled={!row.peralatanId || (opt?.stok ?? 0) <= 0}
                            className={`w-full rounded-2xl border bg-slate-50 px-2 py-2 text-sm text-slate-700 text-center outline-none focus:ring-2 disabled:opacity-50 ${
                              rowHasError
                                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removePeralatanRow(i)}
                            className="flex items-center justify-center text-slate-400 hover:text-red-500 text-xl leading-none"
                          >
                            ×
                          </button>
                        </div>
                        {rowHasError && rowErrorMsg && (
                          <p className="text-xs text-red-500 pl-1">{rowErrorMsg}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Tanggal Pakai <span className="text-red-500">*</span>
                <input type="date" value={form.tanggalPakai}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((p) => ({ ...p, tanggalPakai: value }));
                    validateTanggal(value);
                  }}
                  className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
                    tanggalError
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                  }`} />
                {tanggalError && (
                  <p className="mt-1 text-xs text-red-500">{tanggalError}</p>
                )}
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Durasi (Jam) <span className="text-red-500">*</span>
                <input type="number" min={1} max={24} value={form.durasiJam}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((p) => ({ ...p, durasiJam: value }));
                    validateDurasi(value);
                  }}
                  className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
                    durasiError
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                  }`} />
                {durasiError && (
                  <p className="mt-1 text-xs text-red-500">{durasiError}</p>
                )}
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Keperluan / Kegiatan
              <input value={form.keperluan}
                onChange={(e) => setForm((p) => ({ ...p, keperluan: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Contoh: Rapat himpunan, seminar, studi kelompok" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Catatan Tambahan
              <textarea value={form.catatan}
                onChange={(e) => setForm((p) => ({ ...p, catatan: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Informasi tambahan bila diperlukan" />
            </label>

            <button type="submit" disabled={!canSubmit || saving}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300">
              {saving ? "Menyimpan..." : "Ajukan Peminjaman"}
            </button>

            {stockError && (
              <p className="text-xs text-red-500 text-center -mt-2">{stockError}</p>
            )}
          </form>
        </section>

        {/* List */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h2 className="text-lg font-semibold text-slate-900">Riwayat Peminjaman</h2>
            <div className="flex flex-wrap gap-1.5">
              {(["semua", "menunggu", "disetujui", "ditolak", "selesai"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${filterStatus === s
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}>
                  {s === "semua" ? "Semua" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-6"><Spinner /></div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredList.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">Belum ada peminjaman.</div>
              ) : (
                filteredList.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">{item.peminjam.nama}</p>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                            {item.peminjam.jenisAkun}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {item.ruang.nama}
                          {item.ruang.gedung ? ` · ${item.ruang.gedung}` : ""}
                          {item.ruang.lantai ? ` Lt.${item.ruang.lantai}` : ""}
                        </p>
                        {item.peralatanList.length > 0 && (
                          <p className="mt-1 text-xs text-slate-400">
                            {item.peralatanList.map((p) => `${p.peralatan.nama} ×${p.jumlah}`).join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                        {userRole === "admin" && item.status === "menunggu" && (
                          <div className="flex gap-1">
                            <button onClick={() => openModal(item, "disetujui")}
                              className="rounded-xl bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700">
                              ✓ Setujui
                            </button>
                            <button onClick={() => openModal(item, "ditolak")}
                              className="rounded-xl bg-red-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-600">
                              ✗ Tolak
                            </button>
                          </div>
                        )}
                        {userRole === "admin" && item.status === "disetujui" && (
                          <button onClick={() => openModal(item, "selesai")}
                            className="rounded-xl px-3 py-1 text-xs font-medium bg-green-600 text-white">
                            Selesai
                          </button>
                        )}
                      </div>

                      <span className="hidden print:inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Pengajuan</p>
                        <p className="mt-0.5 text-slate-700">{formatDate(item.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Tanggal Pakai</p>
                        <p className="mt-0.5 text-slate-700">{formatDate(item.tanggalPakai)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Durasi</p>
                        <p className="mt-0.5 text-slate-700">{item.durasiJam} jam</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Pengembalian Aktual</p>
                        <p className="mt-0.5 text-slate-700">
                          {item.waktuPengembalianAktual ? formatDateTime(item.waktuPengembalianAktual) : "—"}
                        </p>
                      </div>
                    </div>

                    {(item.keperluan || item.catatan || item.catatanPenolakan) && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                        {item.keperluan && (
                          <div>
                            <p className="text-xs font-medium text-slate-500">Keperluan</p>
                            <p className="mt-0.5 text-slate-700">{item.keperluan}</p>
                          </div>
                        )}
                        {item.catatan && (
                          <div>
                            <p className="text-xs font-medium text-slate-500">Catatan</p>
                            <p className="mt-0.5 text-slate-700">{item.catatan}</p>
                          </div>
                        )}
                        {item.catatanPenolakan && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-red-500">Alasan Penolakan</p>
                            <p className="mt-0.5 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
                              {item.catatanPenolakan}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {/* Admin Status Modal */}
      {modal.open && modal.item && modal.action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div ref={modalRef}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">{ACTION_LABELS[modal.action]}</h3>
              <button onClick={() => setModal(MODAL_INIT)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm space-y-1">
                <p className="font-medium text-slate-900">{modal.item.peminjam.nama}</p>
                <p className="text-slate-500">
                  {modal.item.ruang.nama}
                  {modal.item.ruang.gedung ? ` · ${modal.item.ruang.gedung}` : ""}
                  {modal.item.ruang.lantai ? ` Lt.${modal.item.ruang.lantai}` : ""}
                </p>
                <p className="text-slate-500">
                  {formatDate(modal.item.tanggalPakai)} · {modal.item.durasiJam} jam
                </p>
                {modal.item.peralatanList.length > 0 && (
                  <p className="text-slate-400 text-xs">
                    {modal.item.peralatanList.map((p) => `${p.peralatan.nama} ×${p.jumlah}`).join(", ")}
                  </p>
                )}
              </div>

              {modal.action === "ditolak" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={modal.catatanPenolakan}
                    onChange={(e) => setModal((m) => ({ ...m, catatanPenolakan: e.target.value }))}
                    rows={3}
                    autoFocus
                    placeholder="Contoh: Ruang sedang digunakan untuk kegiatan lain, jadwal bentrok, dll."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              )}

              {modal.action === "selesai" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Waktu Pengembalian
                  </label>
                  <input
                    type="datetime-local"
                    value={modal.waktuPengembalianAktual}
                    onChange={(e) => setModal((m) => ({ ...m, waktuPengembalianAktual: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Defaultnya waktu sekarang. Ubah bila perlu menyesuaikan waktu aktual.
                  </p>
                </div>
              )}

              {modal.action === "disetujui" && (
                <p className="text-sm text-slate-600">
                  Apakah kamu yakin ingin menyetujui peminjaman ini? Status akan berubah menjadi{" "}
                  <span className="font-semibold text-green-700">Disetujui</span>.
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setModal(MODAL_INIT)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Batal
              </button>
              <button
                onClick={handleModalConfirm}
                disabled={submittingModal || (modal.action === "ditolak" && !modal.catatanPenolakan.trim())}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${ACTION_COLORS[modal.action]}`}
              >
                {submittingModal ? "Menyimpan..." : ACTION_LABELS[modal.action]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}