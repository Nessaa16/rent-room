import { POST } from '../route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    ruang: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/ruang', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if nama is missing', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        kapasitas: 50,
      }),
    } as any;

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Nama ruang diperlukan.');
  });

  it('should return 400 if kapasitas is less than 1', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        nama: 'Ruang 101',
        kapasitas: 0,
      }),
    } as any;

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Kapasitas harus lebih dari 0.');
  });

  it('should create ruang successfully', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        nama: 'Ruang 101',
        gedung: 'Gedung A',
        lantai: '1',
        kapasitas: 50,
      }),
    } as any;

    (prisma.ruang.create as jest.Mock).mockResolvedValue({
      id: 1,
      nama: 'Ruang 101',
      gedung: 'Gedung A',
      lantai: '1',
      kapasitas: 50,
    });

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.nama).toBe('Ruang 101');
  });
});