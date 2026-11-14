/*!
 * test-accounts.js — TESTING ONLY. The backend's real login replaces this file (users.username and users.password_hash).
 * One account per sample user. status: active, locked or expired (the last two only exist to try the login messages).
 * landing = the first page each role sees after logging in.
 */
window.ACE_TEST_ACCOUNTS = [
  { username: 'carljohn',      password: 'admin123',    name: 'Carl John',        role: 'admin',       landing: 'dashboard.html',   status: 'active' },
  { username: 'jsantos',     password: 'cashier123',  name: 'Jun Santos',       role: 'cashier',     landing: 'orders.html',      status: 'active' },
  { username: 'lramos',      password: 'cashier456',  name: 'Liza Ramos',       role: 'cashier',     landing: 'orders.html',      status: 'active' },
  { username: 'mdelacruz',   password: 'kitchen123',  name: 'Mario Dela Cruz',  role: 'kitchen',     landing: 'inventory.html',   status: 'active' },
  { username: 'cmendoza',    password: 'inventory123', name: 'Carla Mendoza',   role: 'inventory',   landing: 'inventory.html',   status: 'active' },
  { username: 'pgarcia',     password: 'procure123',  name: 'Paolo Garcia',     role: 'procurement', landing: 'procurement.html', status: 'active' },
  { username: 'tvillanueva', password: 'locked123',   name: 'Tessa Villanueva', role: 'kitchen',     landing: 'inventory.html',   status: 'locked' },
  { username: 'expired',     password: 'expired123',  name: 'Expired Session',  role: 'cashier',     landing: 'orders.html',      status: 'expired' }
];
