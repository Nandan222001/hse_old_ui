import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient from '../../src/api/client';
import { TokenStorage } from '../../src/utils/storage';

describe('apiClient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    // Reset storage between tests
    (require('@react-native-async-storage/async-storage').default as any).__resetStore();
  });

  afterEach(() => {
    mock.restore();
  });

  it('attaches Authorization header when a token is in storage', async () => {
    await TokenStorage.setTokens('test-access-token', 'test-refresh-token');
    mock.onGet('/me').reply(config => {
      expect(config.headers?.Authorization).toBe('Bearer test-access-token');
      return [200, { id: 'u1' }];
    });
    const res = await apiClient.get('/me');
    expect(res.data).toEqual({ id: 'u1' });
  });

  it('omits Authorization header when no token is in storage', async () => {
    mock.onGet('/me').reply(config => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { id: 'u1' }];
    });
    const res = await apiClient.get('/me');
    expect(res.data).toEqual({ id: 'u1' });
  });

  it('unwraps the { success, message, data } envelope on responses', async () => {
    mock.onGet('/things').reply(200, {
      success: true,
      message: 'ok',
      data: { items: [1, 2, 3] },
    });
    const res = await apiClient.get('/things');
    expect(res.data).toEqual({ items: [1, 2, 3] });
  });

  it('leaves response data untouched when there is no envelope', async () => {
    mock.onGet('/plain').reply(200, { hello: 'world' });
    const res = await apiClient.get('/plain');
    expect(res.data).toEqual({ hello: 'world' });
  });

  it('on 401, clears all tokens from storage', async () => {
    // The new (refresh-aware) interceptor falls into the "no refresh token
    // stored" branch when the refresh_token slot is empty, which is what we
    // want to exercise here: a 401 with no way to recover must wipe state.
    await TokenStorage.setTokens('will-be-cleared', '');
    await TokenStorage.setUser({
      id: 'u1',
      employee_id: 'E1',
      name: 'X',
      role: 'driver',
      site: 'S',
      department: 'D',
    });

    mock.onGet('/protected').reply(401, { detail: 'unauthorized' });

    await expect(apiClient.get('/protected')).rejects.toBeDefined();

    // After 401, the interceptor should have cleared tokens + user
    const t = await TokenStorage.getAccessToken();
    const u = await TokenStorage.getUser();
    expect(t).toBeNull();
    expect(u).toBeNull();
  });
});
