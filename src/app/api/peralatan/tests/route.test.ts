import { POST } from '../route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    peralatan: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('POST /api/peralatan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if kode is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        nama: 'Projector',
        jumlah: 5,
      }),
    } as any;

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Kode peralatan diperlukan.');
  });

  it('should return 400 if nama is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        kode: 'PROJ001',
        jumlah: 5,
      }),
    } as any;

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Nama peralatan diperlukan.');
  });

  it('should return 400 if jumlah is less than 1', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        kode: 'PROJ001',
        nama: 'Projector',
        jumlah: 0,
      }),
    } as any;

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Jumlah stok harus lebih dari 0.');
  });

  it('should return 409 if kode already exists', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        kode: 'PROJ001',
        nama: 'Projector',
        jumlah: 5,
      }),
    } as any;

    (prisma.peralatan.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Kode "PROJ001" sudah digunakan.');
  });

  it('should create peralatan successfully', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        kode: 'PROJ001',
        nama: 'Projector',
        kategori: 'Elektronik',
        jumlah: 5,
      }),
    } as any;

    (prisma.peralatan.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.peralatan.create as jest.Mock).mockResolvedValue({
      id: 1,
      kode: 'PROJ001',
      nama: 'Projector',
      kategori: 'Elektronik',
      jumlah: 5,
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.kode).toBe('PROJ001');
  });
});