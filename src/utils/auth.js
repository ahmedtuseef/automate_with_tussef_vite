// src/utils/auth.js
// Mock auth for demo only. Exposes loginWithUsername and registerNewUser.

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

/**
 * registerNewUser({ username, firstName, lastName, dob, phone, password })
 * - stores user in localStorage as "user:<username>"
 * - sets auth_current to username
 * - throws 'username_taken' if already exists
 */
export async function registerNewUser({ username, firstName, lastName, dob, phone, password }) {
  await sleep(400);
  if (!username) throw new Error('username_required');
  const key = `user:${username}`;
  if (localStorage.getItem(key)) {
    const err = new Error('username_taken');
    throw err;
  }
  const record = { username, firstName, lastName, dob, phone, password };
  localStorage.setItem(key, JSON.stringify(record));
  localStorage.setItem('auth_current', username);
  return record;
}

/**
 * loginWithUsername(username, password)
 * - checks localStorage for user:<username>
 * - throws 'user_not_found' or 'invalid_credentials' errors
 */
export async function loginWithUsername(username, password) {
  await sleep(300);
  if (!username) {
    const err = new Error('user_not_found');
    throw err;
  }
  const key = `user:${username}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    const err = new Error('user_not_found');
    throw err;
  }
  const record = JSON.parse(raw);
  if (record.password !== password) {
    const err = new Error('invalid_credentials');
    throw err;
  }
  localStorage.setItem('auth_current', username);
  return record;
}

/** optional helper */
export function getCurrentUser() {
  const u = localStorage.getItem('auth_current');
  if (!u) return null;
  const raw = localStorage.getItem(`user:${u}`);
  return raw ? JSON.parse(raw) : null;
}
