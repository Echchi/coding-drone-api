export const mockJwtService = {
  sign: jest.fn().mockReturnValue('mockAccessToken'),
  verify: jest.fn().mockImplementation((token) => {
    if (token === 'validRefreshToken') {
      return { userid: 'tester', sub: 1 };
    }
    throw new Error('Invalid token');
  }),
};
