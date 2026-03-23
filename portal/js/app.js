/* -- Config -- */
const SUPABASE_URL  = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY  = 'YOUR_SUPABASE_ANON_KEY';
const COMMISSION    = 0.15;
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(s) { return escHtml(s); }
let currentUser = null;
let isAdmin     = false;
function statusBadge(status) {
  const map = { active: ['status-active', 'Active'], hold: ['status-hold', 'On Hold'], cancelled: ['status-cancelled', 'Cancelled'], inactive: ['status-inactive', 'Inactive'] };
  const cfg = map[status] || ['status-hold', status || 'Unknown'];
  return '<span class="status-badge ' + cfg[0] + '">' + cfg[1] + '</span>';
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.auth-tab').forEach(btn => btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab)));
  document.getElementById('form-login').addEventListener('submit', handleLogin);
  document.getElementById('form-register').addEventListener('submit', handleRegister);
  document.getElementById('form-forgot').addEventListener('submit', handleForgotPassword);
  document.getElementById('btn-forgot').addEventListener('click', () => showAuthForm('forgot'));
  document.getElementById('btn-back-login').addEventListener('click', () => showAuthForm('login'));
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-open-add-client').addEventListener('click', openModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('add-client-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('form-add-client').addEventListener('submit', handleAddClient);
  document.getElementById('client-plan').addEventListener('change', e => {
    const fees = { 'Option A Basic': 3000, 'Option A Professional': 4500, 'Option A Premium': 5000 };
    const fee = (fees[e.target.value] != null) ? fees[e.target.value] : '';
    if (fee) document.getElementById('client-fee').value = fee;
  });
  sb.auth.onAuthStateChange(async (_event, session) => {
    if (session && session.user) {
      currentUser = session.user; await resolveAdmin(); showScreen('dashboard'); loadDashboard();
    } else { currentUser = null; isAdmin = false; showScreen('auth'); }
  });
});
async function resolveAdmin() {
  const { data } = await sb.from('agents').select('is_admin, full_name').eq('id', currentUser.id).single();
  isAdmin = !!(data && data.is_admin);
  const name = (data && data.full_name) || currentUser.email;
  document.getElementById('header-welcome').textContent = 'Welcome, ' + name;
  document.getElementById('header-user').classList.remove('hidden');
  ['col-paydue', 'col-desc', 'col-approve'].forEach(id => document.getElementById(id).classList.toggle('hidden', !isAdmin));
}
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login');
  btn.disabled = true; showMsg('login-error', '');
  const { error } = await sb.auth.signInWithPassword({ email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-password').value });
  if (error) showMsg('login-error', error.message);
  btn.disabled = false;
}
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-register');
  btn.disabled = true; showMsg('reg-error', ''); showMsg('reg-success', '');
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass  = document.getElementById('reg-password').value;
  const { error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name, phone } } });
  if (error) { showMsg('reg-error', error.message); }
  else { showMsg('reg-success', 'Account created! Please check your email to confirm.', true); e.target.reset(); }
  btn.disabled = false;
}
async function handleForgotPassword(e) {
  e.preventDefault();
  showMsg('forgot-error', ''); showMsg('forgot-success', '');
  const email = document.getElementById('forgot-email').value.trim();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/portal/' });
  if (error) { showMsg('forgot-error', error.message); }
  else { showMsg('forgot-success', 'Reset link sent - check your inbox.', true); }
}
async function handleLogout() { await sb.auth.signOut(); document.getElementById('header-user').classList.add('hidden'); }
async function loadDashboard() { await Promise.all([loadClients(), loadInvoices()]); }
async function loadClients() {
  const tbody = document.getElementById('clients-tbody');
  const cols = isAdmin ? 9 : 6;
  tbody.innerHTML = '<tr><td colspan="' + cols + '" class="empty-row">Loading…</td></tr>';
  const query = isAdmin ? sb.from('clients').select('*, agents(full_name)').order('created_at', { ascending: false }) : sb.from('clients').select('*').eq('agent_id', currentUser.id).order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) { tbody.innerHTML = '<tr><td colspan="' + cols + '" class="empty-row">Error loading clients.</td></tr>'; return; }
  renderClients(data || []); renderStats(data || []); await loadTotalEarned();
}
function renderClients(clients) {
  const tbody = document.getElementById('clients-tbody');
  const cols = isAdmin ? 9 : 6;
  if (!clients.length) { tbody.innerHTML = '<tr><td colspan="' + cols + '" class="empty-row">No clients yet.</td></tr>'; document.getElementById('total-commission').textContent = 'NT$0'; return; }
  let totalComm = 0;
  const rows = clients.map(c => {
    const fee = Number(c.monthly_fee) || 0; const comm = fee * COMMISSION;
    if (c.status === 'active') totalComm += comm;
    const badge = statusBadge(c.status);
    const agentInfo = (isAdmin && c.agents) ? '<span style="font-size:0.8rem;color:var(--text-muted)">' + escHtml(c.agents.full_name) + '</span><br>' : '';
    const startDate = c.start_date ? new Date(c.start_date).toLocaleDateString() : '—';
    let adminCols = '';
    if (isAdmin) {
      const statuses = ['hold', 'active', 'cancelled', 'inactive'];
      const labels   = { hold: 'On Hold', active: 'Active', cancelled: 'Cancelled', inactive: 'Inactive' };
      const opts = statuses.map(s => '<option value="' + s + '"' + (c.status === s ? ' selected' : '') + '>' + labels[s] + '</option>').join('');
      const due = c.payment_deadline ? new Date(c.payment_deadline).toLocaleDateString() : (c.status === 'hold' ? '7 days from start' : '—');
      adminCols = '<td>' + due + '</td>'
        + '<td><input class="desc-input" data-id="' + escAttr(c.id) + '" value="' + escAttr(c.description || '') + '" placeholder="Notes…"></td>'
        + '<td><select class="status-select" data-id="' + escAttr(c.id) + '">' + opts + '</select></td>';
    }
    return '<tr><td>' + agentInfo + escHtml(c.client_name)
      + '</td><td>' + escHtml(c.plan)
      + '</td><td>NT$' + fee.toLocaleString()
      + '</td><td>NT$' + comm.toLocaleString()
      + '</td><td>' + badge
      + '</td><td>' + startDate
      + adminCols + '</tr>';
  });
  tbody.innerHTML = rows.join('');
  document.getElementById('total-commission').textContent = 'NT$' + totalComm.toLocaleString();
  if (isAdmin) {
    tbody.querySelectorAll('.status-select').forEach(sel => sel.addEventListener('change', () => updateClientStatus(sel.dataset.id, sel.value)));
    tbody.querySelectorAll('.desc-input').forEach(inp => {
      let timer;
      inp.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => updateClientDesc(inp.dataset.id, inp.value), 800); });
    });
  }
}
function renderStats(clients) {
  const active = clients.filter(c => c.status === 'active');
  const monthly = active.reduce((s, c) => s + Number(c.monthly_fee) * COMMISSION, 0);
  document.getElementById('stat-clients').textContent = clients.length;
  document.getElementById('stat-monthly').textContent = 'NT$' + monthly.toLocaleString();
  document.getElementById('stat-yearly').textContent  = 'NT$' + (monthly * 12).toLocaleString();
}
async function loadTotalEarned() {
  let query = sb.from('invoices').select('commission_amount').eq('status', 'paid');
  if (!isAdmin) query = query.eq('agent_id', currentUser.id);
  const { data } = await query;
  const total = (data || []).reduce((s, r) => s + Number(r.commission_amount), 0);
  document.getElementById('stat-earned').textContent = 'NT$' + total.toLocaleString();
}
async function updateClientStatus(id, status) {
  const { error } = await sb.from('clients').update({ status }).eq('id', id);
  if (error) { showToast('Error updating status.'); loadClients(); return; }
  showToast('Status updated!'); renderStats([]); loadClients();
}
async function updateClientDesc(id, description) {
  const { error } = await sb.from('clients').update({ description }).eq('id', id);
  if (error) showToast('Error saving notes.');
}
async function loadInvoices() {
  const tbody = document.getElementById('invoices-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Loading…</td></tr>';
  let query = sb.from('invoices').select('*, clients(client_name)').eq('status', 'pending').order('due_date');
  if (!isAdmin) query = query.eq('agent_id', currentUser.id);
  const { data, error } = await query;
  if (error) { tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Error loading invoices.</td></tr>'; return; }
  renderInvoices(data || []);
}
function renderInvoices(invoices) {
  const tbody = document.getElementById('invoices-tbody');
  if (!invoices.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No pending invoices.</td></tr>'; return; }
  const rows = invoices.map(inv => {
    const amount = Number(inv.commission_amount) || 0;
    const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—';
    const client = (inv.clients && inv.clients.client_name) || '—';
    const payBtn = isAdmin ? '<button type="button" class="btn-pay" data-id="' + escAttr(inv.id) + '">Mark Paid</button>' : '<span style="color:var(--text-muted);font-size:0.85rem">Pending</span>';
    return '<tr><td>' + escHtml(client) + '</td><td>NT$' + amount.toLocaleString() + '</td><td>' + due + '</td><td>' + payBtn + '</td></tr>';
  });
  tbody.innerHTML = rows.join('');
  tbody.querySelectorAll('.btn-pay').forEach(btn => btn.addEventListener('click', () => markInvoicePaid(btn.dataset.id)));
}
async function markInvoicePaid(id) {
  const { error } = await sb.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
  if (error) { showToast('Error updating invoice.'); return; }
  showToast('Invoice marked as paid!'); loadInvoices(); loadTotalEarned();
}
async function handleAddClient(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-client');
  btn.disabled = true; showMsg('add-client-error', '');
  const startVal = document.getElementById('client-start').value;
  let payDeadline = null;
  if (startVal) { const d = new Date(startVal); d.setDate(d.getDate() + 7); payDeadline = d.toISOString().split('T')[0]; }
  const { error } = await sb.from('clients').insert({
    agent_id: currentUser.id,
    client_name: document.getElementById('client-name').value.trim(),
    plan: document.getElementById('client-plan').value,
    monthly_fee: Number(document.getElementById('client-fee').value),
    start_date: startVal || null,
    payment_deadline: payDeadline,
    description: document.getElementById('client-desc').value.trim() || null,
    status: 'hold',
  });
  if (error) { showMsg('add-client-error', error.message); }
  else { closeModal(); e.target.reset(); showToast('Client submitted for approval!'); loadClients(); }
  btn.disabled = false;
}
function showScreen(name) {
  document.getElementById('auth-screen').classList.toggle('hidden', name !== 'auth');
  document.getElementById('dashboard-screen').classList.toggle('hidden', name !== 'dashboard');
}
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  showAuthForm(tab);
}
function showAuthForm(name) {
  ['login', 'register', 'forgot'].forEach(f => document.getElementById('form-' + f).classList.toggle('hidden', f !== name));
  if (name === 'login' || name === 'register') switchAuthTab(name);
}
function openModal()  { document.getElementById('add-client-overlay').classList.remove('hidden'); }
function closeModal() { document.getElementById('add-client-overlay').classList.add('hidden'); }
function showMsg(id, msg, success) {
  const el = document.getElementById(id); if (!el) return;
  el.textContent = msg; el.classList.toggle('hidden', !msg); el.classList.toggle('success', !!success);
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}
