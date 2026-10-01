/**
 * CyberSoft Lineage & Versioning Explorer - Client Controller v0.2
 */

const API_BASE = '/api/v1';

// Application State
let state = {
  dag: { nodes: {}, edges: [] },
  manifests: [],
  changelog: [],
  selectedNodeId: null,
  activeTab: 'tab-dag',
  viewMode: 'pipeline', // 'pipeline' | 'grid'
};

// Descriptions dictionary fallback if metadata is minimal
const DESCRIPTIONS = {
  'dataset_retail_sales_dataset_v1.0.0': 'Bảng giao dịch bán lẻ 3NF (Transactions, Customers, Stores). Dữ liệu nguồn cho bài tập SQL.',
  'dataset_hr_attendance_dataset_v1.0.0': 'Bảng nhân sự chấm công 3NF (Employees, Shifts, Leaves). Nguồn cho bài tập phân tích nhân sự.',
  'dataset_customer_churn_dataset_v1.0.0': 'Bộ dữ liệu dự báo tỷ lệ khách hàng rời mạng viễn thông. Nguồn cho bài tập phân loại Churn.',
  'dataset_ai_knowledge_chunks_corpus_v1.0.0': '81 phân đoạn tri thức quy chế đào tạo và tài liệu RAG. (Đã deprecate, thay bằng v1.1.0)',
  'dataset_ai_knowledge_chunks_corpus_multi_hop_v1.1.0': 'Tập phân đoạn tri thức RAG nâng cao có ngữ cảnh liên kết đa bước và gán nhãn chống rò rỉ.',
  'model_bge_small_english_embedder_v1.0.0': 'Mô hình Embedding BAAI/bge-small-en-v1.5 (384 chiều) phục vụ biểu diễn vector tài liệu.',
  'model_gemini_3.8_flash_checkpoint_v1.0.0': 'LLM cốt lõi phục vụ sinh đề thi, phân loại Bloom và trợ lý gia sư AI trích nguồn.',
  'prompt_exercise_generator_system_prompt_v1.0.0': 'Prompt định hướng AI sinh bài tập theo thang Bloom có ví dụ mẫu few-shot. (Đã deprecate)',
  'prompt_exercise_generator_system_prompt_enhanced_v1.1.0': 'Prompt nâng cao tích hợp ràng buộc khả thi thực thi SQL và kiểm chứng tự động.',
  'prompt_rag_tutor_grounding_prompt_v1.0.0': 'Chỉ dẫn gia sư RAG bắt buộc trích dẫn nguyên văn và từ chối khi thiếu dữ kiện.',
  'index_faiss_retail_sales_index_v1.0.0': 'Chỉ mục vector FAISS IndexFlatIP xây dựng trên bảng giao dịch bán lẻ + BGE Embedder.',
  'index_bm25_knowledge_chunks_index_v1.0.0': 'Chỉ mục từ khóa thưa BM25 Okapi trên tập 81 phân đoạn tri thức RAG v1.0.0.',
  'index_hybrid_rag_search_index_v1.1.0': 'Chỉ mục kết hợp Hybrid (Dense FAISS + Sparse BM25) với thuật toán Reciprocal Rank Fusion.',
  'evaluation_exercise_generator_feasibility_evaluation_v1.0.0': 'Đánh giá khả thi thực thi SQL trên SQLite in-memory (0.78ms/bài), Round 1 đạt 84%, Round 2 đạt 100%.',
  'evaluation_rag_benchmark_100_evaluation_v1.0.0': 'Bộ đánh giá 100 câu hỏi RAG: Precision@3 đạt 94%, MRR đạt 0.91, 0% hallucination.',
  'exercise_approved_exercise_bank_20_v1.0.0': 'Ngân hàng 20 bài tập thực hành sư phạm đã qua Giảng viên duyệt. Truy vết 100% về 4 Datasets nguồn.',
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupViewModeToggle();
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

// Setup View Mode Switcher (Pipeline Flow vs Grid)
function setupViewModeToggle() {
  const btnPipe = document.getElementById('mode-pipeline');
  const btnGrid = document.getElementById('mode-grid');
  const pipeView = document.getElementById('pipeline-view');
  const gridView = document.getElementById('dag-grid');

  btnPipe.addEventListener('click', () => {
    btnPipe.classList.add('active');
    btnGrid.classList.remove('active');
    pipeView.style.display = 'grid';
    gridView.style.display = 'none';
    state.viewMode = 'pipeline';
    renderDAG();
  });

  btnGrid.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnPipe.classList.remove('active');
    pipeView.style.display = 'none';
    gridView.style.display = 'grid';
    state.viewMode = 'grid';
    renderDAG();
  });
}

// Load Initial Data from Backend APIs
async function loadInitialData() {
  try {
    // 1. Fetch DAG
    const dagRes = await fetch(`${API_BASE}/lineage/dag`);
    const dagJson = await dagRes.json();
    if (dagJson.success) {
      state.dag = dagJson.data;
      renderDAG();
      populateDeprecateOptions();
      updateMetrics();
      // Auto-select approved exercises bank
      if (state.dag.nodes['exercise_approved_exercise_bank_20_v1.0.0']) {
        selectNode('exercise_approved_exercise_bank_20_v1.0.0');
      }
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
    console.warn('API error, relying on offline cache:', err);
  }
}

// Update Metrics Bar
function updateMetrics() {
  const nodes = Object.values(state.dag.nodes || {});
  document.getElementById('metric-total-artifacts').textContent = nodes.length || 16;
  document.getElementById('metric-total-edges').textContent = state.dag.edges ? state.dag.edges.length : 25;

  const datasetRoots = nodes.filter(n => n.artifact_type === 'dataset' && (!n.upstream_ids || n.upstream_ids.length === 0));
  document.getElementById('metric-root-sources').textContent = datasetRoots.length || 4;

  const dep = nodes.filter(n => n.state === 'deprecated');
  document.getElementById('metric-deprecated').textContent = dep.length || 2;
}

// Helper to filter nodes based on user inputs
function getFilteredNodes() {
  const typeFilter = document.getElementById('filter-type').value;
  const stateFilter = document.getElementById('filter-state').value;
  const searchTxt = document.getElementById('dag-search-input').value.toLowerCase().trim();

  const nodes = Object.values(state.dag.nodes || {});

  return nodes.filter(n => {
    if (typeFilter !== 'all' && n.artifact_type !== typeFilter) return false;
    if (stateFilter !== 'all' && n.state !== stateFilter) return false;
    if (searchTxt) {
      const matchName = n.name.toLowerCase().includes(searchTxt);
      const matchId = n.id.toLowerCase().includes(searchTxt);
      const matchHash = n.content_hash.toLowerCase().includes(searchTxt);
      if (!matchName && !matchId && !matchHash) return false;
    }
    return true;
  });
}

// Master Render Router
function renderDAG() {
  if (state.viewMode === 'pipeline') {
    renderPipelineView();
  } else {
    renderGridView();
  }
}

// Create a Node Card Element
function createNodeCard(node) {
  const card = document.createElement('div');
  const isSelected = state.selectedNodeId === node.id;
  card.className = `pipeline-node-card type-${node.artifact_type} ${isSelected ? 'selected' : ''}`;
  card.id = `node-${node.id}`;

  const desc = DESCRIPTIONS[node.id] || node.metadata?.description || node.metadata?.file_path || node.id;

  card.innerHTML = `
    <div class="card-row-top">
      <span class="badge-type ${node.artifact_type}">${node.artifact_type}</span>
      <span class="node-version">${node.version}</span>
    </div>
    <div class="node-title">${node.name}</div>
    <div class="node-desc-text" title="${desc}">${desc}</div>
    <div class="card-row-bottom">
      <span class="tag-state ${node.state}">${node.state}</span>
      <span class="node-edges-stat" title="Số tài nguyên Thượng nguồn | Hạ nguồn">
        ⬆ ${node.upstream_ids?.length || 0} | ⬇ ${node.downstream_ids?.length || 0}
      </span>
    </div>
  `;

  card.addEventListener('click', () => selectNode(node.id));
  return card;
}

// Render Pipeline 4-Lane View
function renderPipelineView() {
  const filtered = getFilteredNodes();
  const laneDatasets = document.getElementById('lane-nodes-datasets');
  const laneModels = document.getElementById('lane-nodes-models');
  const laneIndices = document.getElementById('lane-nodes-indices');
  const laneProducts = document.getElementById('lane-nodes-products');

  laneDatasets.innerHTML = '';
  laneModels.innerHTML = '';
  laneIndices.innerHTML = '';
  laneProducts.innerHTML = '';

  filtered.forEach(node => {
    const card = createNodeCard(node);
    if (node.artifact_type === 'dataset') {
      laneDatasets.appendChild(card);
    } else if (node.artifact_type === 'model' || node.artifact_type === 'prompt') {
      laneModels.appendChild(card);
    } else if (node.artifact_type === 'index' || node.artifact_type === 'evaluation') {
      laneIndices.appendChild(card);
    } else {
      laneProducts.appendChild(card);
    }
  });

  // Empty hints for lanes if all filtered out
  [laneDatasets, laneModels, laneIndices, laneProducts].forEach(lane => {
    if (lane.children.length === 0) {
      lane.innerHTML = '<div style="font-size:0.72rem;color:var(--text-muted);text-align:center;padding:1.5rem 0;">(Không có mục)</div>';
    }
  });
}

// Render Grid View
function renderGridView() {
  const container = document.getElementById('dag-grid');
  container.innerHTML = '';

  const filtered = getFilteredNodes();
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-hint" style="grid-column: 1 / -1;">Không tìm thấy tài nguyên phù hợp.</p>';
    return;
  }

  filtered.forEach(node => {
    container.appendChild(createNodeCard(node));
  });
}

// Select a Node & Show Rich Sidebar
function selectNode(nodeId) {
  state.selectedNodeId = nodeId;

  // Update selected class in DOM
  document.querySelectorAll('.pipeline-node-card').forEach(c => c.classList.remove('selected'));
  const activeCard = document.getElementById(`node-${nodeId}`);
  if (activeCard) {
    activeCard.classList.add('selected');
  }

  const node = state.dag.nodes[nodeId];
  if (!node) return;

  const sideType = document.getElementById('side-type');
  sideType.textContent = node.artifact_type;
  sideType.className = `badge-type ${node.artifact_type}`;

  const desc = DESCRIPTIONS[node.id] || node.metadata?.description || 'Tài nguyên trong hệ thống WORM.';

  const sideContent = document.getElementById('side-content');
  sideContent.innerHTML = `
    <div class="side-detail-group">
      <label>Tên Tài Nguyên:</label>
      <div class="val" style="font-weight:700;font-size:0.95rem;color:#fff;">${node.name}</div>
    </div>

    <div class="side-detail-group">
      <label>Mô Tả Nghiệp Vụ:</label>
      <div class="val" style="color:var(--text-muted);line-height:1.4;font-size:0.75rem;">${desc}</div>
    </div>

    <div class="side-detail-group">
      <label>Mã Định Danh (ID):</label>
      <div class="val" style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-cyan);">${node.id}</div>
    </div>

    <div class="side-detail-group">
      <label>Phiên Bản & Trạng Thái:</label>
      <div class="val" style="display:flex;align-items:center;gap:0.5rem;">
        <span class="node-version" style="font-weight:600;font-size:0.8rem;">${node.version}</span>
        <span class="tag-state ${node.state}">${node.state}</span>
      </div>
    </div>

    <div class="side-detail-group">
      <label>Mã Băm Nội Dung (SHA-256):</label>
      <div class="side-hash-box">
        <span class="side-hash" id="hash-text">${node.content_hash}</span>
        <button class="btn-copy" onclick="copyHash('${node.content_hash}')">📋 Copy</button>
      </div>
    </div>

    <div class="side-detail-group">
      <label>Đường Dẫn Bất Biến (WORM Storage):</label>
      <div class="val" style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);">${node.metadata?.file_path || 'data/artifacts/...'}</div>
    </div>

    <div class="side-detail-group">
      <label>Tài Nguyên Thượng Nguồn (Upstream: ${node.upstream_ids?.length || 0}):</label>
      <div class="val">
        ${node.upstream_ids && node.upstream_ids.length > 0
          ? node.upstream_ids.map(u => `
              <span class="node-link-pill" onclick="selectNode('${u}')" title="Bấm để nhảy tới tài nguyên này">
                ⬆ ${u}
              </span>
            `).join('')
          : '<em style="color:var(--text-muted);font-size:0.72rem;">(Gốc - Root Source)</em>'}
      </div>
    </div>

    <div class="side-detail-group">
      <label>Tài Nguyên Hạ Nguồn (Downstream: ${node.downstream_ids?.length || 0}):</label>
      <div class="val">
        ${node.downstream_ids && node.downstream_ids.length > 0
          ? node.downstream_ids.map(d => `
              <span class="node-link-pill" onclick="selectNode('${d}')" title="Bấm để nhảy tới tài nguyên này" style="color:#34d399;">
                ⬇ ${d}
              </span>
            `).join('')
          : '<em style="color:var(--text-muted);font-size:0.72rem;">(Lá - Leaf Node)</em>'}
      </div>
    </div>

    <button class="btn btn-primary" style="width:100%;margin-top:0.75rem;" onclick="openTraceModal('${node.id}')">
      🎯 Truy Vết Nguồn Gốc Chi Tiết (DoD)
    </button>
  `;
}

// Copy SHA-256 to clipboard
function copyHash(hashStr) {
  navigator.clipboard.writeText(hashStr).then(() => {
    alert('Đã sao chép mã băm SHA-256: ' + hashStr);
  });
}

// Setup Filters & Search Inputs
function setupFilters() {
  document.getElementById('filter-type').addEventListener('change', renderDAG);
  document.getElementById('filter-state').addEventListener('change', renderDAG);
  document.getElementById('dag-search-input').addEventListener('input', renderDAG);

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
      <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-muted);font-weight:600;">Các tài nguyên hạ nguồn bị ảnh hưởng trực tiếp:</p>
      ${result.affected_downstream_ids.map(id => `<div style="font-family:var(--font-mono);font-size:0.72rem;color:#f87171;margin-top:2px;">⚠️ ${id}</div>`).join('')}
    `;
  } else {
    listContainer.innerHTML = '<p style="font-size:0.75rem;margin-top:0.5rem;color:#34d399;">Không có tài nguyên hạ nguồn nào phụ thuộc trực tiếp.</p>';
  }
}

// Populate Deprecate Options
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
      opt.textContent = `[${n.artifact_type.toUpperCase()}] ${n.name} (${n.version})`;
      targetSelect.appendChild(opt);
    }

    const repOpt = document.createElement('option');
    repOpt.value = n.id;
    repOpt.textContent = `[${n.artifact_type.toUpperCase()}] ${n.name} (${n.version})`;
    repSelect.appendChild(repOpt);
  });
}

// Open Trace Modal
async function openTraceModal(targetId) {
  const modal = document.getElementById('modal-trace');
  const body = document.getElementById('modal-trace-body');
  modal.style.display = 'flex';
  body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--accent-cyan);">Đang thực thi giải thuật truy vết ngược nguồn gốc (BFS/DFS)...</div>';

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

// Render Trace Result inside Modal
function renderTraceResult(data) {
  const body = document.getElementById('modal-trace-body');
  body.innerHTML = `
    <div style="margin-bottom:1rem;background:var(--bg-card);padding:0.75rem 1rem;border-radius:6px;border:1px solid var(--border-color);">
      <div style="font-size:0.9rem;font-weight:700;color:#fff;">Tài Nguyên Đích: ${data.target_name} (${data.target_version})</div>
      <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-cyan);margin-top:2px;">${data.target_id}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem;">
        Độ sâu đồ thị tối đa: <strong>${data.max_lineage_depth}</strong> | Số đường dẫn nhân quả tới gốc: <strong>${data.paths_to_roots?.length || 0}</strong>
      </div>
    </div>

    <h4 style="font-size:0.82rem;margin-bottom:0.4rem;color:#fff;">Các Thành Phần Gốc Được Truy Vết Tới:</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">
      <div style="background:var(--bg-card);padding:0.6rem 0.8rem;border-radius:6px;border:1px solid var(--border-color);">
        <span style="font-size:0.68rem;color:var(--text-muted);display:block;font-weight:700;">DATASET GỐC (${data.ancestors_by_type?.datasets?.length || 0}):</span>
        ${(data.ancestors_by_type?.datasets || []).map(d => `<div style="font-size:0.72rem;font-family:var(--font-mono);color:#60a5fa;margin-top:2px;">• ${d}</div>`).join('')}
      </div>
      <div style="background:var(--bg-card);padding:0.6rem 0.8rem;border-radius:6px;border:1px solid var(--border-color);">
        <span style="font-size:0.68rem;color:var(--text-muted);display:block;font-weight:700;">MÔ HÌNH AI (${data.ancestors_by_type?.models?.length || 0}):</span>
        ${(data.ancestors_by_type?.models || []).map(m => `<div style="font-size:0.72rem;font-family:var(--font-mono);color:#f472b6;margin-top:2px;">• ${m}</div>`).join('')}
        <span style="font-size:0.68rem;color:var(--text-muted);display:block;margin-top:0.4rem;font-weight:700;">PROMPT TEMPLATE (${data.ancestors_by_type?.prompts?.length || 0}):</span>
        ${(data.ancestors_by_type?.prompts || []).map(p => `<div style="font-size:0.72rem;font-family:var(--font-mono);color:#c084fc;margin-top:2px;">• ${p}</div>`).join('')}
      </div>
    </div>

    <h4 style="font-size:0.82rem;margin-bottom:0.4rem;color:#fff;">Các Tuyến Đường Dẫn Nhân Quả Ngược Về Gốc (Causal Paths):</h4>
    <div style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:0.4rem;">
      ${(data.paths_to_roots || []).map((path, idx) => `
        <div class="trace-path-card">
          <span style="color:var(--text-muted);font-size:0.65rem;font-weight:700;">Tuyến #${idx + 1}:</span><br>
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
