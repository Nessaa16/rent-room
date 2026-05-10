import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => {
      return {
        status: init?.status ?? 200,
        json: async () => body,
      };
    },
  },
  NextRequest: jest.fn(),
}));