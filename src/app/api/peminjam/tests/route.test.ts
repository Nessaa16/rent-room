import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/serverAuth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    peminjam: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/serverAuth', () => ({
  getUserFromRequest: jest.fn(),
}));

describe('POST /api/peminjam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if nama is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        nimNik: '123456',
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Nama diperlukan.');
  });

  it('should return 400 if jenisAkun is invalid', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        nama: 'John Doe',
        jenisAkun: 'invalid',
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Jenis akun tidak valid.');
  });

  it('should create peminjam successfully', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        nama: 'John Doe',
        nimNik: '123456',
        telp: '08123456789',
        fakultas: 'Teknik',
        jenisAkun: 'mahasiswa',
      }),
    } as any;

    (getUserFromRequest as jest.Mock).mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'mahasiswa' },
    });

    (prisma.peminjam.create as jest.Mock).mockResolvedValue({
      id: 1,
      nama: 'John Doe',
      nimNik: '123456',
      telp: '08123456789',
      email: 'test@example.com',
      fakultas: 'Teknik',
      jenisAkun: 'mahasiswa',
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.nama).toBe('John Doe');
  });
});