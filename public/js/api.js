const API = {
  token: localStorage.getItem('lv_token'),

  async request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (this.token) opts.headers['Authorization'] = 'Bearer ' + this.token;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem('lv_token', t);
    else localStorage.removeItem('lv_token');
  },

  register: (d) => API.request('POST', '/auth/register', d),
  login: (d) => API.request('POST', '/auth/login', d),
  getMe: () => API.request('GET', '/auth/me'),
  changePassword: (d) => API.request('PUT', '/auth/password', d),

  getEntries: (s, page) => API.request('GET', '/vault/entries' + (s ? '?section=' + s : '') + (page ? (s ? '&' : '?') + 'page=' + page : '')),
  getEntry: (id) => API.request('GET', '/vault/entries/' + id),
  createEntry: (d) => API.request('POST', '/vault/entries', d),
  updateEntry: (id, d) => API.request('PUT', '/vault/entries/' + id, d),
  deleteEntry: (id) => API.request('DELETE', '/vault/entries/' + id),
  getSummary: () => API.request('GET', '/vault/summary'),
  search: (q) => API.request('GET', '/vault/search?q=' + encodeURIComponent(q)),
  exportVault: () => API.request('GET', '/vault/export'),
  backupVault: () => API.request('GET', '/vault/backup'),
  restoreVault: (entries, mode) => API.request('POST', '/vault/restore', { entries, mode }),

  getBeneficiaries: () => API.request('GET', '/beneficiaries'),
  addBeneficiary: (d) => API.request('POST', '/beneficiaries', d),
  removeBeneficiary: (id) => API.request('DELETE', '/beneficiaries/' + id),
  denyEmergency: (id) => API.request('POST', '/beneficiaries/' + id + '/deny-emergency'),
  grantAccess: (id) => API.request('POST', '/beneficiaries/' + id + '/grant'),
  revokeAccess: (id) => API.request('POST', '/beneficiaries/' + id + '/revoke'),
  regenerateToken: (id) => API.request('POST', '/beneficiaries/' + id + '/regenerate-token'),

  getSwitchStatus: () => API.request('GET', '/deadswitch/status'),
  updateSwitch: (d) => API.request('PUT', '/deadswitch/config', d),
  checkIn: () => API.request('POST', '/deadswitch/checkin'),

  getAuditLog: (page) => API.request('GET', '/audit?page=' + (page || 1)),

  requestEmergency: (t) => API.request('POST', '/beneficiaries/emergency-access', { accessToken: t }),
  accessVault: (t) => API.request('POST', '/beneficiaries/access', { accessToken: t })
};
