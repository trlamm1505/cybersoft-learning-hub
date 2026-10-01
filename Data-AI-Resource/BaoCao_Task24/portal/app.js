/**
 * CyberSoft Lineage & Versioning Explorer - Client Controller v0.1
 */

const API_BASE = '/api/v1';

// State Store
let state = {
  dag: { nodes: {}, edges: [] },
  manifests: [],
  changelog: [],
  selectedNodeId: null,
  activeTab: 'tab-dag',
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupFilters();
  setupModals();
  await loadInitialData();
});

// Setup Navigation Tabs
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
      state.activeTab = targetId;

      if (targetId === 'tab-manifests' && state.manifests.length > 0) {
        selectRelease(state.manifests[state.manifests.length - 1].release_id);
      } else if (targetId === 'tab-rollback') {
        loadRollbackNote();
      }
    });
  });
}

// Load Data from APIs
async function loadInitialData() {
  try {
    // 1. Fetch DAG
    const dagRes = await fetch(`${API_BASE}/lineage/dag`);
    const dagJson = await dagRes.json();
    if (dagJson.success) {
      state.dag = dagJson.data;
      renderDAGGrid();
      populateDeprecateOptions();
      updateMetrics();
    }

    // 2. Fetch Manifests
    const manRes = await fetch(`${API_BASE}/releases/manifests`);
    const manJson = await manRes.json();
    if (manJson.success) {
      state.manifests = manJson.data;
      renderReleaseSelector();
    }

    // 3. Fetch Changelog
    const chRes = await fetch(`${API_BASE}/releases/changelog`);
    const chJson = await chRes.json();
    if (chJson.success) {
      state.changelog = chJson.data;
      renderChangelog();
    }
  } catch (err) {
    console.warn('API fetch warning, using embedded offline fallback data:', err);
    loadOfflineFallback();
  }
}

// Update Top Metrics
function updateMetrics() {
  const nodes = Object.values(state.dag.nodes || {});
  document.getElementById('metric-total-artifacts').textContent = nodes.length || 16;
  document.getElementById('metric-total-edges').textContent = state.dag.edges ? state.dag.edges.length : 25;

  const roots = nodes.filter(n => !n.upstream_ids || n.upstream_ids.length === 0);
  document.getElementById('metric-root-sources').textContent = roots.length || 4;

  const dep = nodes.filter(n => n.state === 'deprecated');
  document.getElementById('metric-deprecated').textContent = dep.length || 2;
}

// Render DAG Cards Grid
function renderDAGGrid() {
  const container = document.getElementById('dag-grid');
  container.innerHTML = '';

  const typeFilter = document.getElementById('filter-type').value;
  const stateFilter = document.getElementById('filter-state').value;
  const searchTxt = document.getElementById('dag-search-input').value.toLowerCase().trim();

  const nodes = Object.values(state.dag.nodes || {});

  const filtered = nodes.filter(n => {
    if (typeFilter !== 'all' && n.artifact_type !== typeFilter) return false;
    if (stateFilter !== 'all' && n.state !== stateFilter) return false;
    if (searchTxt && !n.name.toLowerCase().includes(searchTxt) && !n.id.toLowerCase().includes(searchTxt)) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-hint">Không tìm thấy tài nguyên phù hợp bộ lọc.</p>';
    return;
  }

  filtered.forEach(node => {
    const card = document.createElement('div');
    card.className = `dag-node-card ${state.selectedNodeId === node.id ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="node-top">
        <span class="badge-type ${node.artifact_type}">${node.artifact_type}</span>
        <span class="node-version">${node.version}</span>
      </div>
      <div class="node-name">${node.name}</div>
      <div class="node-desc">${node.metadata?.file_path || node.id}</div>
      <div class="node-footer">
        <span class="tag-state ${node.state}">${node.state}</span>
        <span>⬆ ${node.upstream_ids?.length || 0} | ⬇ ${node.downstream_ids?.length || 0}</span>
      </div>
    `;
    card.addEventListener('click', () => selectNode(node.id));
    container.appendChild(card);
  });
}

// Select Node and Show Detail in Sidebar
function selectNode(nodeId) {
  state.selectedNodeId = nodeId;
  document.querySelectorAll('.dag-node-card').forEach(c => c.classList.remove('selected'));
  renderDAGGrid();

  const node = state.dag.nodes[nodeId];
  if (!node) return;

  const sideType = document.getElementById('side-type');
  sideType.textContent = node.artifact_type;
  sideType.className = `badge-type ${node.artifact_type}`;

  const sideContent = document.getElementById('side-content');
  sideContent.innerHTML = `
    <div class="side-detail-group">
      <label>Tên Tài Nguyên:</label>
      <div class="val" style="font-weight:700;">${node.name}</div>
    </div>
    <div class="side-detail-group">
      <label>Mã Định Danh (ID):</label>
      <div class="val" style="font-family:var(--font-mono);font-size:0.75rem;">${node.id}</div>
    </div>
    <div class="side-detail-group">
      <label>Phiên Bản & Trạng Thái:</label>
      <div class="val">
        <span class="node-version">${node.version}</span>
        <span class="tag-state ${node.state}" style="margin-left:0.5rem;">${node.state}</span>
      </div>
    </div>
    <div class="side-detail-group">
      <label>Mã Băm Nội Dung (SHA-256):</label>
      <div class="side-hash">${node.content_hash}</div>
    </div>
    <div class="side-detail-group">
      <label>Tài Nguyên Thượng Nguồn (Upstream ${node.upstream_ids?.length || 0}):</label>
      <div class="val">
        ${node.upstream_ids?.length > 0
          ? node.upstream_ids.map(u => `<div style="font-family:var(--font-mono);font-size:0.7rem;color:#60a5fa;margin-bottom:2px;">• ${u}</div>`).join('')
          : '<em style="color:var(--text-muted);font-size:0.75rem;">(Gốc - Root Node)</em>'}
      </div>
    </div>
    <div class="side-detail-group">
      <label>Tài Nguyên Phụ Thuộc Hạ Nguồn (Downstream ${node.downstream_ids?.length || 0}):</label>
      <div class="val">
        ${node.downstream_ids?.length > 0
          ? node.downstream_ids.map(d => `<div style="font-family:var(--font-mono);font-size:0.7rem;color:#34d399;margin-bottom:2px;">• ${d}</div>`).join('')
          : '<em style="color:var(--text-muted);font-size:0.75rem;">(Lá - Leaf Node)</em>'}
      </div>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:0.75rem;" onclick="openTraceModal('${node.id}')">
      🎯 Truy Vết Nguồn Gốc Chi Tiết
    </button>
  `;
}

// Setup Filters & Search
function setupFilters() {
  document.getElementById('filter-type').addEventListener('change', renderDAGGrid);
  document.getElementById('filter-state').addEventListener('change', renderDAGGrid);
  document.getElementById('dag-search-input').addEventListener('input', renderDAGGrid);

  document.getElementById('btn-quick-trace').addEventListener('click', () => {
    openTraceModal('exercise_approved_exercise_bank_20_v1.0.0');
  });

  // Deprecate form
  const form = document.getElementById('form-deprecate');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetId = document.getElementById('deprecate-target').value;
    const reason = document.getElementById('deprecate-reason').value;
    const replacement = document.getElementById('deprecate-replacement').value;
    const sunset = document.getElementById('deprecate-sunset').value;

    try {
      const res = await fetch(`${API_BASE}/artifacts/${targetId}/deprecate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact_id: targetId,
          reason: reason,
          superseded_by: replacement,
          sunset_date: sunset,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showDeprecateResult(data.data);
        await loadInitialData();
      } else {
        alert('Lỗi: ' + (data.error?.message || 'Không thể deprecate tài nguyên.'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ.');
    }
  });

  document.getElementById('btn-refresh-rollback').addEventListener('click', loadRollbackNote);
}

// Show Deprecation Result Box
function showDeprecateResult(result) {
  const box = document.getElementById('lifecycle-result');
  box.style.display = 'block';

  document.getElementById('lifecycle-alert-msg').textContent = result.warning_message;

  const listContainer = document.getElementById('lifecycle-downstream-list');
  if (result.affected_downstream_ids && result.affected_downstream_ids.length > 0) {
    listContainer.innerHTML = `
      <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-muted);">Các tài nguyên hạ nguồn bị ảnh hưởng:</p>
      ${result.affected_downstream_ids.map(id => `<div style="font-family:var(--font-mono);font-size:0.72rem;color:#f87171;">⚠️ ${id}</div>`).join('')}
    `;
  } else {
    listContainer.innerHTML = '<p style="font-size:0.75rem;margin-top:0.5rem;color:#34d399;">Không có tài nguyên hạ nguồn nào phụ thuộc.</p>';
  }
}

// Populate Deprecate Select Options
function populateDeprecateOptions() {
  const targetSelect = document.getElementById('deprecate-target');
  const repSelect = document.getElementById('deprecate-replacement');
  targetSelect.innerHTML = '';
  repSelect.innerHTML = '<option value="">-- Không có (Ngừng hẳn) --</option>';

  const nodes = Object.values(state.dag.nodes || {});
  nodes.forEach(n => {
    if (n.state === 'active') {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = `[${n.artifact_type}] ${n.name} (${n.version})`;
      targetSelect.appendChild(opt);
    }

    const repOpt = document.createElement('option');
    repOpt.value = n.id;
    repOpt.textContent = `[${n.artifact_type}] ${n.name} (${n.version})`;
    repSelect.appendChild(repOpt);
  });
}

// Open Trace Modal and Call Backtrace API
async function openTraceModal(targetId) {
  const modal = document.getElementById('modal-trace');
  const body = document.getElementById('modal-trace-body');
  modal.style.display = 'flex';
  body.innerHTML = '<div class="loading-spinner">Đang truy vết nguồn gốc nhân quả...</div>';

  try {
    const res = await fetch(`${API_BASE}/lineage/trace/${targetId}`);
    const json = await res.json();
    if (json.success) {
      renderTraceResult(json.data);
    } else {
      body.innerHTML = `<p style="color:#ef4444;">Lỗi: ${json.error?.message || 'Không thể truy vết.'}</p>`;
    }
  } catch (err) {
    body.innerHTML = '<p style="color:#ef4444;">Lỗi kết nối máy chủ khi thực hiện truy vết.</p>';
  }
}

function renderTraceResult(data) {
  const body = document.getElementById('modal-trace-body');
  body.innerHTML = `
    <div style="margin-bottom:1rem;background:var(--bg-card);padding:0.75rem 1rem;border-radius:6px;border:1px solid var(--border-color);">
      <div style="font-size:0.85rem;font-weight:700;color:#fff;">Tài Nguyên Đích: ${data.target_name} (${data.target_version})</div>
      <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-cyan);">${data.target_id}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem;">
        Độ sâu đồ thị tối đa: <strong>${data.max_lineage_depth}</strong> | Số đường dẫn nhân quả tới gốc: <strong>${data.paths_to_roots?.length || 0}</strong>
      </div>
    </div>

    <h4 style="font-size:0.82rem;margin-bottom:0.4rem;color:#fff;">Các Thành Phần Gốc Được Truy Vết Tới:</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">
      <div style="background:var(--bg-card);padding:0.6rem 0.8rem;border-radius:6px;border:1px solid var(--border-color);">
        <span style="font-size:0.7rem;color:var(--text-muted);display:block;">DATASET GỐC (${data.ancestors_by_type?.datasets?.length || 0}):</span>
        ${(data.ancestors_by_type?.datasets || []).map(d => `<div style="font-size:0.72rem;font-family:var(--font-mono);color:#60a5fa;">• ${d}</div>`).join('')}
      </div>
      <div style="background:var(--bg-card);padding:0.6rem 0.8rem;border-radius:6px;border:1px solid var(--border-color);">
        <span style="font-size:0.7rem;color:var(--text-muted);display:block;">MÔ HÌNH AI (${data.ancestors_by_type?.models?.length || 0}):</span>
        ${(data.ancestors_by_type?.models || []).map(m => `<div style="font-size:0.72rem;font-family:var(--font-mono);color:#f472b6;">• ${m}</div>`).join('')}
        <span style="font-size:0.7rem;color:var(--text-muted);display:block;margin-top:0.4rem;">PROMPT TEMPLATE (${data.ancestors_by_type?.prompts?.length || 0}):</span>
        ${(data.ancestors_by_type?.prompts || []).map(p => `<div style="font-size:0.72rem;font-family:var(--font-mono);color:#c084fc;">• ${p}</div>`).join('')}
      </div>
    </div>

    <h4 style="font-size:0.82rem;margin-bottom:0.4rem;color:#fff;">Các Tuyến Đường Dẫn Nhân Quả Ngược Về Gốc (Causal Paths):</h4>
    <div style="max-height:240px;overflow-y:auto;">
      ${(data.paths_to_roots || []).map((path, idx) => `
        <div class="trace-path-card">
          <span style="color:var(--text-muted);font-size:0.68rem;">Tuyến #${idx + 1}:</span><br>
          ${path.map((nodeId, nIdx) => {
            const isLast = (nIdx === path.length - 1);
            return `<span style="color:${isLast ? '#34d399' : '#60a5fa'};font-weight:${isLast ? '700' : '400'};">${nodeId}</span>`;
          }).join(' ➔ ')}
        </div>
      `).join('')}
    </div>
  `;
}

// Setup Modals
function setupModals() {
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-trace').style.display = 'none';
  });
}

// Render Release Selector in Tab 2
function renderReleaseSelector() {
  const container = document.getElementById('release-list');
  container.innerHTML = '';

  state.manifests.forEach(m => {
    const item = document.createElement('div');
    item.className = 'release-item';
    item.id = `rel-item-${m.release_id}`;
    item.innerHTML = `
      <div class="release-item-top">
        <span class="release-item-ver">${m.version}</span>
        <span class="release-item-date">${m.release_date?.split('T')[0] || ''}</span>
      </div>
      <div class="release-item-name">${m.release_name}</div>
    `;
    item.addEventListener('click', () => selectRelease(m.release_id));
    container.appendChild(item);
  });
}

// Select Release in Tab 2
function selectRelease(releaseId) {
  document.querySelectorAll('.release-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById(`rel-item-${releaseId}`);
  if (el) el.classList.add('active');

  const m = state.manifests.find(x => x.release_id === releaseId);
  if (!m) return;

  document.getElementById('manifest-title').textContent = `${m.release_name} (${m.version})`;
  document.getElementById('manifest-sub').textContent = m.description || m.release_notes;
  document.getElementById('manifest-checksum').textContent = m.holistic_checksum;

  const tbody = document.querySelector('#table-manifest-components tbody');
  tbody.innerHTML = '';

  const comps = Object.values(m.components || {});
  comps.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge-type ${c.artifact_type}">${c.artifact_type}</span></td>
      <td><strong>${c.name}</strong></td>
      <td><code class="node-version">${c.version}</code></td>
      <td><span class="tag-state ${c.state}">${c.state}</span></td>
      <td><code class="side-hash" style="font-size:0.65rem;">${c.content_hash.slice(0, 16)}...</code></td>
      <td style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.7rem;">${c.storage_path}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Changelog in Tab 3
function renderChangelog() {
  const container = document.getElementById('changelog-timeline');
  container.innerHTML = '';

  state.changelog.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'timeline-entry';
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-head">
          <h3>${entry.release_name}</h3>
          <span class="timeline-badge">${entry.version} • ${entry.release_date?.split('T')[0] || ''}</span>
        </div>
        <ul class="timeline-list">
          ${(entry.items || []).map(i => `
            <li>
              <span class="tag-cat ${i.category}">${i.category}</span>
              <span>${i.description}</span>
            </li>
          `).join('')}
        </ul>
        ${entry.breaking_changes && entry.breaking_changes.length > 0 ? `
          <div style="margin-top:0.6rem;padding:0.4rem 0.6rem;background:rgba(239,68,68,0.1);border-left:3px solid #ef4444;font-size:0.72rem;color:#fca5a5;">
            <strong>Cảnh Báo Chuyển Đổi:</strong> ${entry.breaking_changes.join(' ')}
          </div>
        ` : ''}
      </div>
    `;
    container.appendChild(item);
  });
}

// Load Rollback Note in Tab 5
async function loadRollbackNote() {
  const container = document.getElementById('rollback-note-container');
  try {
    const res = await fetch(`${API_BASE}/releases/rollback-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_release_id: 'rel_v1.1.0',
        target_release_id: 'rel_v1.0.0',
        operator: 'Đào Trung Kiên - Data & AI Resource Engineer',
        reason: 'Diễn tập quy trình khôi phục định kỳ theo chuẩn WORM.',
      }),
    });
    const json = await res.json();
    if (json.success) {
      container.textContent = json.data.markdown_note;
    } else {
      container.textContent = 'Không thể tải hướng dẫn hoàn tác.';
    }
  } catch (err) {
    container.textContent = 'Lỗi kết nối máy chủ.';
  }
}
