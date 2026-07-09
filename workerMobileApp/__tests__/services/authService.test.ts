import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '../../src/api/client';
import { authService } from '../../src/services/authService';
import { TokenStorage } from '../../src/utils/storage';
import { ENDPOINTS } from '../../src/api/endpoints';

describe('authService', () => {
  let mock: MockAdapter;

  const fakeUser = {
    id: 'u1',
    employee_id: 'E001',
    name: 'Test Driver',
    role: 'driver',
    site: 'Plant A',
    department: 'Ops',
  };

  const fakeLoginResponse = {
    success: true,
    message: 'ok',
    data: {
      access_token: 'access-123',
      refresh_token: 'refresh-456',
      token_type: 'bearer',
      must_change_password: false,
      user: fakeUser,
    },
  };

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    (require('@react-native-async-storage/async-storage').default as any).__resetStore();
  });

  afterEach(() => mock.restore());

  describe('login', () => {
    it('POSTs to /auth/login and stores tokens + user', async () => {
      let hit = false;
      mock.onPost(ENDPOINTS.AUTH.LOGIN).reply(() => {
        hit = true;
        return [200, fakeLoginResponse];
      });

      const res = await authService.login({ employee_id: 'E001', pin: '1234' });

      expect(hit).toBe(true);
      expect(res.access_token).toBe('access-123');
      expect(res.refresh_token).toBe('refresh-456');

      const t = await TokenStorage.getAccessToken();
      const r = await TokenStorage.getRefreshToken();
      const u = await TokenStorage.getUser();
      expect(t).toBe('access-123');
      expect(r).toBe('refresh-456');
      expect(u).toEqual(fakeUser);
    });

    it('does not store tokens when the backend returns an error', async () => {
      mock.onPost(ENDPOINTS.AUTH.LOGIN).reply(401, { detail: 'bad creds' });

      await expect(
        authService.login({ employee_id: 'E001', pin: 'wrong' }),
      ).rejects.toBeDefined();

      const t = await TokenStorage.getAccessToken();
      expect(t).toBeNull();
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout and clears storage even if the request succeeds', async () => {
      await TokenStorage.setTokens('a', 'b');
      await TokenStorage.setUser(fakeUser);

      let logoutHit = false;
      mock.onPost(ENDPOINTS.AUTH.LOGOUT).reply(() => {
        logoutHit = true;
        return [204, null];
      });

      await authService.logout();

      expect(logoutHit).toBe(true);
      expect(await TokenStorage.getAccessToken()).toBeNull();
      expect(await TokenStorage.getUser()).toBeNull();
    });

    it('still clears storage even if the logout request fails (and rejects)', async () => {
      await TokenStorage.setTokens('a', 'b');
      await TokenStorage.setUser(fakeUser);

      mock.onPost(ENDPOINTS.AUTH.LOGOUT).reply(500, { detail: 'boom' });

      // The source's try/finally always clears storage, but the axios error
      // is re-thrown. Caller is expected to handle the rejection.
      await expect(authService.logout()).rejects.toBeDefined();

      expect(await TokenStorage.getAccessToken()).toBeNull();
      expect(await TokenStorage.getUser()).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('returns null when no token and no user are in storage', async () => {
      const out = await authService.restoreSession();
      expect(out).toBeNull();
    });

    it('returns null when only a token is present (no user)', async () => {
      await TokenStorage.setTokens('tok', 'ref');
      const out = await authService.restoreSession();
      expect(out).toBeNull();
    });

    it('returns the session when both token and user are present', async () => {
      await TokenStorage.setTokens('tok', 'ref');
      await TokenStorage.setUser(fakeUser);
      const out = await authService.restoreSession();
      expect(out).not.toBeNull();
      expect(out?.token).toBe('tok');
      expect(out?.user).toEqual(fakeUser);
    });
  });
});
