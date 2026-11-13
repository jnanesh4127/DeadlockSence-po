import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { ADMIN_EMAIL } from '../src/config/firebaseAdmin.ts';

function createMockFirebaseToken(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...payload
  })).toString('base64');
  return `${header}.${body}.mock_signature`;
}

describe("DeadlockSense API & Authorization Tests", () => {
  const app = createApp();

  const adminToken = createMockFirebaseToken({
    sub: 'admin_uid_123',
    email: ADMIN_EMAIL,
    email_verified: true,
    admin: true
  });

  const normalUserToken = createMockFirebaseToken({
    sub: 'student_uid_456',
    email: 'student@university.edu',
    email_verified: true,
    admin: false
  });

  it("1: GET /api/healthCheck returns backend and service status", async () => {
    const res = await request(app).get('/api/healthCheck');
    expect(res.status).toBe(200);
    expect(res.body.backend).toBe('online');
    expect(res.body.simulationEngine).toBe('ready');
    expect(res.body.adminEmail).toBe(ADMIN_EMAIL);
  });

  it("2: POST /api/algorithms/bankers/safety requires email sign-in and executes for authenticated users", async () => {
    const samplePayload = {
      resourceNames: ['R1', 'R2'],
      processNames: ['P0', 'P1'],
      totalResources: [5, 5],
      allocation: [[2, 1], [1, 2]],
      max: [[3, 2], [2, 3]]
    };

    // Unauthenticated must fail with 401
    const unauthRes = await request(app)
      .post('/api/algorithms/bankers/safety')
      .send(samplePayload);
    expect(unauthRes.status).toBe(401);

    // Authenticated without email must fail with 403
    const noEmailToken = createMockFirebaseToken({ sub: 'anon_uid_789' });
    const noEmailRes = await request(app)
      .post('/api/algorithms/bankers/safety')
      .set('Authorization', `Bearer ${noEmailToken}`)
      .send(samplePayload);
    expect(noEmailRes.status).toBe(403);

    // Authenticated with email succeeds
    const res = await request(app)
      .post('/api/algorithms/bankers/safety')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send(samplePayload);

    expect(res.status).toBe(200);
    expect(res.body.isSafe).toBe(true);
    expect(res.body.safeSequence.length).toBe(2);
  });

  it("3: Unauthenticated request to /api/simulations returns HTTP 401", async () => {
    const res = await request(app).get('/api/simulations');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it("4: Authenticated user can create and list their own simulation", async () => {
    const createRes = await request(app)
      .post('/api/simulations')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({
        title: 'Student Bankers Lab 1',
        algorithm: 'bankers',
        resourceNames: ['A', 'B'],
        processNames: ['P0', 'P1'],
        totalResources: [4, 4]
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.userId).toBe('student_uid_456');
    expect(createRes.body.id).toBeDefined();

    const listRes = await request(app)
      .get('/api/simulations')
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((s: any) => s.id === createRes.body.id)).toBe(true);
  });

  it("5: Unauthenticated request to /api/admin/users returns HTTP 401", async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it("6: Authenticated normal user accessing /api/admin/users is DENIED with HTTP 403", async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it("7: Designated Administrator (jnanesh4127@gmail.com) accessing /api/admin/users is GRANTED with HTTP 200", async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("8: Normal user submitting feedback receives HTTP 201 and stores feedback", async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({
        category: 'feature_request',
        rating: 5,
        message: 'Please add more pre-built multi-instance deadlock puzzles!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  it("9: Admin can view all submitted feedback and update status", async () => {
    const listRes = await request(app)
      .get('/api/admin/feedback')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);

    const firstFeedback = listRes.body[0];
    const updateRes = await request(app)
      .put(`/api/admin/feedback/${firstFeedback.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
  });

  it("10: Admin analytics endpoint returns comprehensive application metrics", async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.body.totalFeedback).toBeGreaterThanOrEqual(1);
  });
});
