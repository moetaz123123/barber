import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const { default: app } = await import('../src/index.js');

function request(method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      const req = http.request(
        { hostname: '127.0.0.1', port, path, method, headers },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
          });
        }
      );
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.end();
    });
  });
}

describe('protection des routes admin', () => {
  it('refuse /api/admin/dashboard sans jeton', async () => {
    const res = await request('GET', '/api/admin/dashboard');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'UNAUTHORIZED');
  });

  it('refuse /api/admin/appointments avec un faux Bearer', async () => {
    const res = await request('GET', '/api/admin/appointments', {
      Authorization: 'Bearer invalid-token',
    });
    assert.equal(res.status, 401);
  });

  it('répond sur /api/health', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});
