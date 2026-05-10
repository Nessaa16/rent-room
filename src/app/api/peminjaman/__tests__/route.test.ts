import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/serverAuth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    peminjam: {
      findFirst: jest.fn(),
    },
    ruang: {
      findUnique: jest.fn(),
    },
    peralatan: {
      findUnique: jest.fn(),
    },
    peminjaman: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),  
  },
}));

jest.mock('@/lib/serverAuth', () => ({
  getUserFromRequest: jest.fn(),
}));

describe('POST /api/peminjaman', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if peminjamId is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Peminjam wajib dipilih.');
  });

  it('should return 400 if ruangId is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Ruang wajib dipilih.');
  });

  it('should return 400 if tanggalPakai is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Tanggal pakai wajib diisi.');
  });

  it('should return 400 if tanggalPakai is invalid', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: 'invalid-date',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Format tanggal pakai tidak valid.');
  });

  it('should return 400 if durasiJam is not positive', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 0,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Durasi harus lebih dari 0 jam.');
  });

  it('should return 403 if non-admin tries to create for other peminjam', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 2,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe('Tidak dapat membuat peminjaman untuk peminjam lain.');
  });

  it('should return 404 if ruang not found', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Ruang tidak ditemukan.');
  });

  it('should return 409 if ruang not available', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TIDAK_TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Ruang sedang tidak tersedia.');
  });

  it('should return 409 if ruang has conflict', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue({ id: 2 });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toContain('Ruang sudah ada peminjaman');
  });

  it('should return 400 if peralatan jumlah <= 0', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
        peralatanList: [{ peralatanId: 1, jumlah: 0 }],
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Jumlah peralatan yang dipinjam harus lebih dari 0.');
  });

  it('should return 404 if peralatan not found', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
        peralatanList: [{ peralatanId: 1, jumlah: 1 }],
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.peralatan.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Peralatan dengan ID 1 tidak ditemukan.');
  });

  it('should return 409 if peralatan not available', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
        peralatanList: [{ peralatanId: 1, jumlah: 1 }],
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.peralatan.findUnique as jest.Mock).mockResolvedValue({ id: 1, nama: 'Projector', status: 'RUSAK' });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Peralatan "Projector" sedang tidak tersedia (rusak).');
  });

  it('should return 409 if peralatan stock insufficient', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
        peralatanList: [{ peralatanId: 1, jumlah: 5 }],
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.peralatan.findUnique as jest.Mock).mockResolvedValue({ id: 1, nama: 'Projector', status: 'TERSEDIA', jumlah: 3 });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Stok "Projector" tidak cukup. Tersedia: 3 unit, diminta: 5 unit.');
  });

  it('should create peminjaman successfully', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        peminjamId: 1,
        ruangId: 1,
        tanggalPakai: '2026-05-10',
        durasiJam: 2,
        keperluan: 'Meeting',
        peralatanList: [{ peralatanId: 1, jumlah: 1 }],
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.ruang.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TERSEDIA' });
    (prisma.peminjaman.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.peralatan.findUnique as jest.Mock).mockResolvedValue({ id: 1, nama: 'Projector', status: 'TERSEDIA', jumlah: 10 });
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback(prisma);
    });
    (prisma.peminjaman.create as jest.Mock).mockResolvedValue({
      id: 1,
      status: 'MENUNGGU',
      peminjam: {},
      ruang: {},
      peralatanList: [],
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});