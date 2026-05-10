"use client";

import { useEffect, useState } from "react";
import { Users, DoorOpen, Package, ClipboardList, Clock, CheckCircle, XCircle, Archive } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

interface DashboardStats {
  totalPeminjam: number;
  totalRuang: number;
  totalPeralatan: number;
  totalPeminjaman: number;
  menunggu: number;
  disetujui: number;
  ditolak: number;
  selesai: number;
}

interface RecentItem {
  id: number;
  nama_peminjam: string;
  nama_ruang: string;
  tanggal_pakai: string;
  status: "menunggu" | "disetujui" | "ditolak" | "selesai";
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data.stats);
          setRecent(data.data.recentPeminjaman);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-400">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Ringkasan Riwayat Keseluruhan Peminjaman Ruang & Peralatan</h1>
        <p className="mt-2 text-sm text-slate-500">Kelola peminjam, ruang, peralatan, dan peminjaman dalam satu sistem.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Peminjam" value={stats?.totalPeminjam ?? 0} icon={<Users className="w-5 h-5" />} color="bg-blue-50" />
        <StatCard label="Total Ruang" value={stats?.totalRuang ?? 0} icon={<DoorOpen className="w-5 h-5" />} color="bg-violet-50" />
        <StatCard label="Total Peralatan" value={stats?.totalPeralatan ?? 0} icon={<Package className="w-5 h-5" />} color="bg-orange-50" />
        <StatCard label="Total Peminjaman" value={stats?.totalPeminjaman ?? 0} icon={<ClipboardList className="w-5 h-5" />} color="bg-teal-50" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Status Peminjaman</h2>
          <div className="mt-5 space-y-3">
            {[
              { label: "Menunggu", value: stats?.menunggu ?? 0, icon: <Clock className="w-4 h-4" />, style: "bg-amber-50 text-amber-700" },
              { label: "Disetujui", value: stats?.disetujui ?? 0, icon: <CheckCircle className="w-4 h-4" />, style: "bg-emerald-50 text-emerald-700" },
              { label: "Ditolak", value: stats?.ditolak ?? 0, icon: <XCircle className="w-4 h-4" />, style: "bg-red-50 text-red-700" },
              { label: "Selesai", value: stats?.selesai ?? 0, icon: <Archive className="w-4 h-4" />, style: "bg-slate-100 text-slate-800" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.style}`}>{item.icon}</div>
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Peminjaman Terbaru</h2>
              <p className="text-sm text-slate-500">Entri peminjaman terbaru dari sistem.</p>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-slate-50 p-8 text-center text-slate-500">Belum ada data peminjaman terbaru.</div>
          ) : (
            <div className="mt-6 space-y-3">
              {recent.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.nama_peminjam}</p>
                    <p className="text-sm text-slate-500">{item.nama_ruang}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{item.tanggal_pakai}</span>
                    <Badge variant={item.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
