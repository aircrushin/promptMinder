export function getAdminHeaders({ json = true } = {}) {
  if (typeof window === 'undefined') {
    return json ? { 'Content-Type': 'application/json' } : {}
  }

  const adminEmail = localStorage.getItem('admin_email')
  const adminToken = localStorage.getItem('admin_token')

  const headers = {
    'x-admin-email': adminEmail || '',
    'x-admin-token': adminToken || '',
  }

  if (json) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}
