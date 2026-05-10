"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
  createdAt: string;
}

interface FormState {
  nama: string;
  email: string;
  password: string;
  role: "mahasiswa" | "dosen";
}

interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  user: User | null;
  form: FormState;
  loading: boolean;
  error: string | null;
}

const EMPTY_FORM: FormState = {
  nama: "",
  email: "",
  password: "",
  role: "mahasiswa",
};

const MODAL_INIT: ModalState = {
  open: false,
  mode: "create",
  user: null,
  form: EMPTY_FORM,
  loading: false,
  error: null,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(MODAL_INIT);
  const [deleting, setDeleting] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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

  async function loadUsers() {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setModal({
      open: true,
      mode: "create",
      user: null,
      form: EMPTY_FORM,
      loading: false,
      error: null,
    });
  }

  function openEditModal(user: User) {
    setModal({
      open: true,
      mode: "edit",
      user,
      form: { nama: user.nama, email: user.email, password: "", role: user.role as "mahasiswa" | "dosen" },
      loading: false,
      error: null,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModal((p) => ({ ...p, loading: true, error: null }));

    try {
      const method = modal.mode === "create" ? "POST" : "PUT";
      const url =
        modal.mode === "create" ? "/api/users" : `/api/users/${modal.user?.id}`;

      const body: any = {
        nama: modal.form.nama,
        email: modal.form.email,
        role: modal.form.role,
      };

      if (modal.form.password) {
        body.password = modal.form.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setModal((p) => ({ ...p, error: data.message || "Gagal menyimpan." }));
        return;
      }

      if (modal.mode === "create") {
        setUsers((prev) => [data.data, ...prev]);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === data.data.id ? data.data : u))
        );
      }

      setModal(MODAL_INIT);
    } catch (error) {
      console.error("Error submitting:", error);
      setModal((p) => ({ ...p, error: "Gagal menyimpan." }));
    }
  }

  async function handleDelete(userId: number) {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    setDeleting(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Gagal menghapus.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Gagal menghapus user.");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Kelola User</h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat dan kelola user mahasiswa.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-500"
        >
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Belum ada user. Buat user baru dengan klik tombol "Tambah User".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Terdaftar
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900">
                      {user.nama}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "dosen"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === "admin"
                          ? "Admin"
                          : user.role === "dosen"
                          ? "Dosen"
                          : "Mahasiswa"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {user.role !== "admin" && (
                          <>
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deleting === user.id}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-3xl shadow-lg max-w-md w-full p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {modal.mode === "create" ? "Tambah User Baru" : "Edit User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Nama <span className="text-red-500">*</span>
                <input
                  type="text"
                  value={modal.form.nama}
                  onChange={(e) =>
                    setModal((p) => ({
                      ...p,
                      form: { ...p.form, nama: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
                <input
                  type="email"
                  value={modal.form.email}
                  onChange={(e) =>
                    setModal((p) => ({
                      ...p,
                      form: { ...p.form, email: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Role <span className="text-red-500">*</span>
                <select
                  value={modal.form.role}
                  onChange={(e) =>
                    setModal((p) => ({
                      ...p,
                      form: { ...p.form, role: e.target.value as "mahasiswa" | "dosen" },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password{" "}
                {modal.mode === "create" ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-slate-500">(Kosongkan jika tidak ingin ubah)</span>
                )}
                <input
                  type="password"
                  value={modal.form.password}
                  onChange={(e) =>
                    setModal((p) => ({
                      ...p,
                      form: { ...p.form, password: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required={modal.mode === "create"}
                />
              </label>

              {modal.error && (
                <p className="text-sm text-red-500">{modal.error}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={modal.loading}
                  className="flex-1 bg-orange-400 text-white rounded-2xl py-2.5 font-medium hover:bg-orange-500 disabled:opacity-50"
                >
                  {modal.loading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setModal(MODAL_INIT)}
                  disabled={modal.loading}
                  className="flex-1 border border-slate-200 text-slate-700 rounded-2xl py-2.5 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
