import { auth, api, onAuthStateChanged, signOut } from './firebase.js';

const $ = (selector) => document.querySelector(selector);
const page = window.APP_PAGE;
const message = $('#app-message');
let profile = null;

function notify(text, error = false) {
  message.textContent = text;
  message.className = error ? 'notice error' : 'notice success';
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function date(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}
function showView(name) {
  ['dashboard','tickets','new-ticket','ticket-detail','users'].forEach(v => {
    const el = document.getElementById(`${v}-view`);
    if (el) el.hidden = v !== name;
  });
}
function ticketCard(t) {
  const tech = t.tecnicoResponsavel?.nome || 'Não atribuído';
  return `<article class="ticket-card">
    <div><strong>${escapeHtml(t.titulo)}</strong><span class="muted">#${escapeHtml(t.id.slice(0,8))} · ${escapeHtml(t.autorNome)}</span></div>
    <div class="ticket-meta"><span class="tag">${escapeHtml(t.status)}</span><span class="tag">${escapeHtml(t.prioridade)}</span><span>${escapeHtml(tech)}</span></div>
    <p>${escapeHtml(t.descricao)}</p><small class="muted">${date(t.criadoEm)}</small>
    <a href="/chamados/${encodeURIComponent(t.id)}">Abrir detalhes</a>
  </article>`;
}
async function loadTickets() {
  const { chamados } = await api('/api/chamados');
  $('#tickets-list').innerHTML = chamados.length ? chamados.map(ticketCard).join('') : '<p class="empty">Nenhum chamado encontrado.</p>';
  return chamados;
}
async function dashboard() {
  const { chamados } = await api('/api/chamados');
  const open = chamados.filter(t => !['Resolvido','Fechado'].includes(t.status)).length;
  $('#stats').innerHTML = `<div class="stat"><span>Chamados visíveis</span><strong>${chamados.length}</strong></div><div class="stat"><span>Em aberto</span><strong>${open}</strong></div><div class="stat"><span>Resolvidos</span><strong>${chamados.length-open}</strong></div>`;
  $('#recent-tickets').innerHTML = chamados.slice(0,5).map(ticketCard).join('') || '<p class="empty">Ainda não há chamados.</p>';
}
async function detail() {
  const id = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop());
  const { chamado, comentarios } = await api(`/api/chamados/${encodeURIComponent(id)}`);
  const staff = ['tecnico','admin'].includes(profile.perfil);
  $('#ticket-detail').innerHTML = `<div class="panel">
    <div class="section-head"><div><span class="tag">${escapeHtml(chamado.status)}</span><span class="tag">${escapeHtml(chamado.prioridade)}</span><h2>${escapeHtml(chamado.titulo)}</h2></div>${staff ? `<button id="assume-ticket" class="btn primary">Assumir chamado</button>` : ''}</div>
    <p>${escapeHtml(chamado.descricao)}</p>
    <p class="muted">Solicitante: ${escapeHtml(chamado.autorNome)} (${escapeHtml(chamado.autorEmail)}) · ${date(chamado.criadoEm)}</p>
    ${staff ? `<form id="status-form" class="inline-form"><label>Status<select name="status">${['Aberto','Em andamento','Aguardando','Resolvido','Fechado'].map(s=>`<option ${s===chamado.status?'selected':''}>${s}</option>`).join('')}</select></label><button class="btn primary">Atualizar status</button></form>` : ''}
    <h3>Pareceres e comentários</h3><div>${comentarios.map(c=>`<div class="comment"><strong>${escapeHtml(c.autorNome)}</strong><p>${escapeHtml(c.texto)}</p><small>${date(c.criadoEm)}</small></div>`).join('') || '<p class="muted">Nenhum parecer ainda.</p>'}</div>
    <form id="comment-form"><label>Adicionar parecer/comentário<textarea name="texto" required maxlength="3000"></textarea></label><button class="btn primary">Enviar</button></form>
    ${profile.perfil==='admin' ? '<button id="delete-ticket" class="btn danger">Excluir chamado</button>' : ''}
  </div>`;
  $('#comment-form').addEventListener('submit', async e => {
    e.preventDefault();
    try { await api(`/api/chamados/${encodeURIComponent(id)}/pareceres`, {method:'POST',body:JSON.stringify({texto:new FormData(e.currentTarget).get('texto')})}); await detail(); notify('Comentário enviado.'); }
    catch(err){notify(err.message,true);}
  });
  if (staff) {
    $('#assume-ticket').addEventListener('click', async()=>{try{await api(`/api/chamados/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({assumir:true})});await detail();notify('Chamado assumido.');}catch(e){notify(e.message,true);}});
    $('#status-form').addEventListener('submit',async e=>{e.preventDefault();try{await api(`/api/chamados/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({status:new FormData(e.currentTarget).get('status')})});await detail();notify('Status atualizado.');}catch(err){notify(err.message,true);}});
  }
  if (profile.perfil==='admin') $('#delete-ticket').addEventListener('click',async()=>{if(!confirm('Excluir este chamado permanentemente?'))return;try{await api(`/api/chamados/${encodeURIComponent(id)}`,{method:'DELETE'});location.href='/chamados';}catch(e){notify(e.message,true);}});
}
async function users() {
  const { usuarios } = await api('/api/usuarios');
  $('#users-list').innerHTML = `<div class="user-list">${usuarios.map(u=>`<div class="user-row"><div><strong>${escapeHtml(u.nome)}</strong><small>${escapeHtml(u.email)}</small></div><select data-uid="${escapeHtml(u.uid)}">${['user','tecnico','admin'].map(r=>`<option value="${r}" ${r===u.perfil?'selected':''}>${r}</option>`).join('')}</select></div>`).join('')}</div>`;
  $('#users-list').querySelectorAll('select').forEach(select=>select.addEventListener('change',async()=>{try{await api(`/api/usuarios/${encodeURIComponent(select.dataset.uid)}/perfil`,{method:'PATCH',body:JSON.stringify({perfil:select.value})});notify('Perfil atualizado.');}catch(e){notify(e.message,true);}}));
}

$('#logout').addEventListener('click', async()=>{await signOut(auth);location.href='/login';});
$('#ticket-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.currentTarget).entries());
  try{await api('/api/chamados',{method:'POST',body:JSON.stringify(data)});location.href='/chamados';}
  catch(err){notify(err.message,true);}
});

onAuthStateChanged(auth, async user=>{
  if(!user){location.href='/login';return;}
  try{
    await api('/api/auth/bootstrap',{method:'POST',body:JSON.stringify({})});
    const result=await api('/api/auth/me');profile=result.usuario;
    $('#profile-chip').textContent=`${profile.nome} · ${profile.perfil}`;
    $('#nav-users').hidden=profile.perfil!=='admin';
    if(page==='dashboard'){showView('dashboard');await dashboard();}
    else if(page==='tickets'){showView('tickets');await loadTickets();}
    else if(page==='new-ticket'){showView('new-ticket');}
    else if(page==='ticket-detail'){showView('ticket-detail');await detail();}
    else if(page==='users'){
      if(profile.perfil!=='admin'){location.href='/403';return;}
      showView('users');await users();
    }
  }catch(error){notify(error.message,true);}
});
