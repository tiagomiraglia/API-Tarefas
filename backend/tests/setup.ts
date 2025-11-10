/// <reference types="jest" />

// Setup global test environment

// Mock Prisma Client
const mockPrisma: any = {
  cartao: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  cartaoTransferencia: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    groupBy: () => Promise.resolve([]),
  },
  usuario: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
  },
  $transaction: (callback: any) => callback(mockPrisma),
};

// Make mock available globally
(global as any).mockPrisma = mockPrisma;

// Increase timeout for integration tests
if (typeof (global as any).jest !== 'undefined') {
  (global as any).jest.setTimeout(10000);

  // Clean up after each test
  (global as any).afterEach(() => {
    (global as any).jest.clearAllMocks();
  });
}
