import { Response } from 'express';

export const mockResponse = (): Response => {
  return {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(), // 체이닝을 위해 `this` 반환
    json: jest.fn(),
    send: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
};
