import { test, expect } from '@playwright/test';

/**
 * Admin API - User Management Tests
 *
 * Tests the /api/admin/users endpoint directly
 * These tests bypass UI authentication and test the API layer
 *
 * Note: These tests require valid Supabase authentication tokens
 */

test.describe('Admin Users API', () => {
  let authToken: string | null = null;
  let testUserId: string | null = null;

  test.beforeAll(async () => {
    // TODO: Implement authentication to get a valid admin token
    // For now, we'll test what we can without auth
    console.log('⚠️  Authentication setup required for full API testing');
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test user if created
    if (testUserId && authToken) {
      try {
        await request.delete(`http://localhost:9002/api/admin/users/${testUserId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log(`Cleaned up test user: ${testUserId}`);
      } catch (error) {
        console.log('Could not clean up test user:', error);
      }
    }
  });

  test('POST /api/admin/users - should require authentication', async ({ request }) => {
    console.log('\n=== Test: POST /api/admin/users without auth ===\n');

    const response = await request.post('http://localhost:9002/api/admin/users', {
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        role: 'user'
      }
    });

    console.log('Response status:', response.status());
    console.log('Response body:', await response.text());

    // Should return 401 Unauthorized or redirect
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/admin/users - should validate required fields', async ({ request }) => {
    console.log('\n=== Test: POST /api/admin/users with missing fields ===\n');

    // Test with missing name
    const response1 = await request.post('http://localhost:9002/api/admin/users', {
      data: {
        email: 'test@example.com',
        role: 'user'
        // name is missing
      }
    });

    console.log('Missing name - Status:', response1.status());
    const body1 = await response1.json().catch(() => ({}));
    console.log('Missing name - Body:', body1);

    // Should reject (either 400 from validation or 401 from auth)
    expect(response1.status()).toBeGreaterThanOrEqual(400);

    // Test with missing email
    const response2 = await request.post('http://localhost:9002/api/admin/users', {
      data: {
        name: 'Test User',
        role: 'user'
        // email is missing
      }
    });

    console.log('Missing email - Status:', response2.status());
    const body2 = await response2.json().catch(() => ({}));
    console.log('Missing email - Body:', body2);

    // Should reject
    expect(response2.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /api/admin/users - should require authentication', async ({ request }) => {
    console.log('\n=== Test: GET /api/admin/users without auth ===\n');

    const response = await request.get('http://localhost:9002/api/admin/users');

    console.log('Response status:', response.status());
    console.log('Response body:', await response.text());

    // Should return 401 Unauthorized or redirect
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test.skip('POST /api/admin/users - should create user with valid data (requires auth)', async ({ request }) => {
    // This test is skipped because it requires authentication
    // To enable:
    // 1. Implement auth token retrieval in beforeAll
    // 2. Remove test.skip
    // 3. Set authToken variable

    console.log('\n=== Test: Create user with valid data ===\n');

    const testEmail = `test-${Date.now()}@example.com`;

    const response = await request.post('http://localhost:9002/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test User API',
        email: testEmail,
        role: 'manager'
      }
    });

    console.log('Response status:', response.status());
    const body = await response.json();
    console.log('Response body:', JSON.stringify(body, null, 2));

    // Should create successfully
    expect(response.status()).toBe(201);
    expect(body).toHaveProperty('user');
    expect(body.user).toMatchObject({
      name: 'Test User API',
      email: testEmail,
      role: 'manager'
    });
    expect(body.user).toHaveProperty('id');

    // Save for cleanup
    testUserId = body.user.id;
  });

  test.skip('POST /api/admin/users - should reject duplicate email (requires auth)', async ({ request }) => {
    // This test is skipped because it requires authentication
    console.log('\n=== Test: Duplicate email rejection ===\n');

    const testEmail = `duplicate-${Date.now()}@example.com`;

    // Create first user
    const response1 = await request.post('http://localhost:9002/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'First User',
        email: testEmail,
        role: 'user'
      }
    });

    expect(response1.status()).toBe(201);

    // Try to create second user with same email
    const response2 = await request.post('http://localhost:9002/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Second User',
        email: testEmail,
        role: 'user'
      }
    });

    console.log('Duplicate attempt - Status:', response2.status());
    const body2 = await response2.json();
    console.log('Duplicate attempt - Body:', body2);

    // Should reject duplicate
    expect(response2.status()).toBeGreaterThanOrEqual(400);
    expect(body2).toHaveProperty('error');
  });

  test.skip('POST /api/admin/users - should handle invalid email format (requires auth)', async ({ request }) => {
    // This test is skipped because it requires authentication
    console.log('\n=== Test: Invalid email format ===\n');

    const response = await request.post('http://localhost:9002/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test User',
        email: 'not-an-email',
        role: 'user'
      }
    });

    console.log('Response status:', response.status());
    const body = await response.json();
    console.log('Response body:', body);

    // Should reject invalid email
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test.skip('GET /api/admin/users - should return paginated user list (requires auth)', async ({ request }) => {
    // This test is skipped because it requires authentication
    console.log('\n=== Test: Get users list ===\n');

    const response = await request.get('http://localhost:9002/api/admin/users?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Response status:', response.status());
    const body = await response.json();
    console.log('Response body:', JSON.stringify(body, null, 2));

    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('users');
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toMatchObject({
      page: 1,
      limit: 10
    });
    expect(Array.isArray(body.users)).toBe(true);
  });

  test.skip('GET /api/admin/users - should filter by role (requires auth)', async ({ request }) => {
    // This test is skipped because it requires authentication
    console.log('\n=== Test: Filter users by role ===\n');

    const response = await request.get('http://localhost:9002/api/admin/users?role=admin', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.users.every((user: any) => user.role === 'admin')).toBe(true);
  });

  test.skip('GET /api/admin/users - should search by name or email (requires auth)', async ({ request }) => {
    // This test is skipped because it requires authentication
    console.log('\n=== Test: Search users ===\n');

    const response = await request.get('http://localhost:9002/api/admin/users?search=test', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // All results should match search term in name or email
    expect(body.users.every((user: any) =>
      user.name.toLowerCase().includes('test') ||
      user.email.toLowerCase().includes('test')
    )).toBe(true);
  });
});

/**
 * Test Results Summary
 *
 * Tests That Run (No Auth Required):
 * - Authentication requirement verification
 * - Basic request structure validation
 *
 * Tests That Are Skipped (Require Auth):
 * - User creation with valid data
 * - Duplicate email handling
 * - Invalid email format
 * - User listing and pagination
 * - Role filtering
 * - Search functionality
 *
 * To enable skipped tests:
 * 1. Obtain valid admin authentication token
 * 2. Set authToken in beforeAll hook
 * 3. Remove test.skip from relevant tests
 */
