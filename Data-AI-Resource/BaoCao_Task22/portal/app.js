/**
 * CyberSoft Data Resource Portal v0.1 — Client Application
 * Author: Đào Trung Kiên (Data & AI Resource Engineer)
 * Project: CyberSoft Learning Hub — Week 5: Productization
 */

// State Management
const state = {
  datasets: [],
  selectedDataset: null,
  activePreviewTab: 'rows',
  currentRating: 5,
  searchDebounceTimer: null,
};

// DOM Elements
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const filterStatus = document.getElementById('filter-status');
const filterDomain = document.getElementById('filter-domain');
const filterLevel = document.getElementById('filter-level');
const filterLicense = document.getElementById('filter-license');
const btnResetFilters = document.getElementById('btn-reset-filters');
const datasetGrid = document.getElementById('dataset-grid');
const resultsCount = document.getElementById('results-count');
const queryTime = document.getElementById('query-time');

// Header Stats
const statTotal = document.getElementById('stat-total');
const statPublished = document.getElementById('stat-published');
const statRating = document.getElementById('stat-rating');

// Modals
const modalPreview = document.getElementById('modal-preview');
const modalFeedback = document.getElementById('modal-feedback');
const modalUsability = document.getElementById('modal-usability');

// Preview Modal Elements
const btnClosePreview = document.getElementById('btn-close-preview');
const btnModalClose = document.getElementById('btn-modal-close');
const btnModalDownload = document.getElementById('btn-modal-download');
const modalPreviewTitle = document.getElementById('modal-preview-title');
const modalPreviewId = document.getElementById('modal-preview-id');
const modalPreviewTier = document.getElementById('modal-preview-tier');
const modalPreviewStatus = document.getElementById('modal-preview-status');
const tabBtnRows = document.getElementById('tab-btn-rows');
const tabBtnSchema = document.getElementById('tab-btn-schema');
const tabBtnIntegrity = document.getElementById('tab-btn-integrity');
const tabContentRows = document.getElementById('tab-content-rows');
const tabContentSchema = document.getElementById('tab-content-schema');
const tabContentIntegrity = document.getElementById('tab-content-integrity');
const previewTableHead = document.getElementById('preview-table-head');
const previewTableBody = document.getElementById('preview-table-body');
const schemaTableBody = document.getElementById('schema-table-body');
const previewSha256 = document.getElementById('preview-sha256');
const btnCopySha256 = document.getElementById('btn-copy-sha256');
const previewLicense = document.getElementById('preview-license');
const previewFilesize = document.getElementById('preview-filesize');
const previewRecords = document.getElementById('preview-records');

// Feedback Modal Elements
const btnCloseFeedback = document.getElementById('btn-close-feedback');
const feedbackDatasetTitle = document.getElementById('feedback-dataset-title');
const starPicker = document.getElementById('star-picker');
const starLabel = document.getElementById('star-label');
const feedbackName = document.getElementById('feedback-name');
const feedbackRole = document.getElementById('feedback-role');
const feedbackComment = document.getElementById('feedback-comment');
const btnSubmitFeedback = document.getElementById('btn-submit-feedback');
const feedbackReviewsList = document.getElementById('feedback-reviews-list');
const feedbackStatsBadge = document.getElementById('feedback-stats-badge');

// Usability Modal Elements
const btnRunUsability = document.getElementById('btn-run-usability');
const btnCloseUsability = document.getElementById('btn-close-usability');
const btnTriggerBenchmark = document.getElementById('btn-trigger-benchmark');
const usabilityResultsList = document.getElementById('usability-results-list');
const usabilityOverallSummary = document.getElementById('usability-overall-summary');
const usabilityTotalTime = document.getElementById('usability-total-time');

// Rating Descriptions
const ratingLabels = {
  1: '1 / 5 — Cần cải thiện chất lượng',
  2: '2 / 5 — Chưa hoàn toàn đáp ứng',
  3: '3 / 5 — Đạt yêu cầu cơ bản',
  4: '4 / 5 — Rất tốt, phù hợp bài giảng',
  5: '5 / 5 — Xuất sắc, chuẩn hóa hoàn hảo',
};

// -------------------------------------------------------------
// API FETCHERS
// -------------------------------------------------------------
async function fetchDatasets() {
  const q = searchInput.value.trim();
  const statusVal = filterStatus.value;
  const domainVal = filterDomain.value;
  const levelVal = filterLevel.value;
  const licenseVal = filterLicense.value;

  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (statusVal) params.append('status', statusVal);
  if (domainVal) params.append('domain', domainVal);
  if (levelVal) params.append('level', levelVal);
  if (licenseVal) params.append('license', licenseVal);

  const startTime = performance.now();
  try {
    const res = await fetch(`/api/v1/portal/datasets?${params.toString()}`);
    const json = await res.json();
    const elapsed = (performance.now() - startTime).toFixed(1);

    if (json.success && json.data) {
      state.datasets = json.data.items;
      renderDatasets(json.data.items);
      resultsCount.textContent = json.data.total;
      queryTime.textContent = `${elapsed} ms`;
    }
  } catch (err) {
    console.error('Fetch datasets error:', err);
    datasetGrid.innerHTML = `
      <div class="p-6 bg-red-950/40 border border-red-800 rounded-xl text-center text-red-300">
        <i class="ph-bold ph-warning text-3xl mb-2"></i>
        <p>Lỗi kết nối đến dịch vụ Portal API. Vui lòng kiểm tra lại máy chủ FastAPI!</p>
      </div>`;
  }
}

async function fetchGlobalStats() {
  try {
    const res = await fetch('/api/v1/portal/stats');
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      if (statTotal) statTotal.textContent = d.total_datasets;
      if (statPublished) statPublished.textContent = d.published_datasets;
      if (statRating) statRating.textContent = `${d.average_portal_rating} / 5.0`;
    }
  } catch (err) {
    console.warn('Could not fetch global stats', err);
  }
}

// -------------------------------------------------------------
// RENDER DATASET CARDS
// -------------------------------------------------------------
function renderDatasets(datasets) {
  if (!datasets || datasets.length === 0) {
    datasetGrid.innerHTML = `
      <div class="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/60 p-8">
        <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500 text-3xl mb-3">
          <i class="ph ph-magnifying-glass"></i>
        </div>
        <h3 class="text-base font-bold text-slate-300">Không tìm thấy tập dữ liệu phù hợp</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Hãy thử đổi từ khóa tìm kiếm hoặc bấm "Đặt lại" bộ lọc ở thanh bên trái.
        </p>
      </div>`;
    return;
  }

  datasetGrid.innerHTML = datasets.map((ds) => {
    const isPub = ds.is_published;
    const tierBadge = ds.quality_tier === 'Tier A'
      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700'
      : 'bg-indigo-950/90 text-indigo-300 border-indigo-700';

    const statusBadge = isPub
      ? '<span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800"><i class="ph-bold ph-check-circle"></i><span>Đã Xuất Bản</span></span>'
      : '<span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800"><i class="ph-bold ph-lock"></i><span>Bản Nháp (Chưa Publish)</span></span>';

    const downloadBtn = isPub
      ? `<button onclick="handleDownload('${ds.id}')" class="px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center space-x-1.5 transition shadow-sm shadow-cyan-600/30 active:scale-95">
          <i class="ph-bold ph-download-simple"></i>
          <span>Tải Dữ Liệu</span>
        </button>`
      : `<button onclick="handleBlockedDownload('${ds.id}')" class="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 rounded-lg flex items-center space-x-1.5 hover:bg-amber-900/60 transition cursor-not-allowed" title="Quy tắc Access Rules: Bản nháp bị chặn tải">
          <i class="ph-bold ph-lock-key"></i>
          <span>Khóa Tải (DoD)</span>
        </button>`;

    return `
      <div class="dataset-card bg-slate-800/70 hover:bg-slate-800 rounded-2xl p-5 border border-slate-700/80 shadow-md backdrop-blur transition-all space-y-4">
        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center space-x-2 flex-wrap gap-y-1">
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-700 text-slate-300 uppercase tracking-wide">
              ${ds.domain}
            </span>
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900 text-slate-300 uppercase tracking-wide">
              ${ds.difficulty_level}
            </span>
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              .${ds.format.toUpperCase()}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierBadge}">
              ${ds.quality_tier} (${ds.quality_score}%)
            </span>
            ${statusBadge}
          </div>

          <div class="flex items-center space-x-1.5 text-amber-400 text-xs font-bold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60 w-fit">
            <i class="ph-fill ph-star"></i>
            <span>${ds.average_rating.toFixed(1)} / 5.0</span>
            <span class="text-slate-500 font-normal font-mono">(${ds.total_ratings})</span>
          </div>
        </div>

        <!-- Title & Description -->
        <div>
          <h3 class="text-base font-bold text-white hover:text-cyan-300 transition cursor-pointer" onclick="openPreview('${ds.id}')">
            ${ds.name}
          </h3>
          <p class="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
            <span>ID: ${ds.id}</span>
            <span>•</span>
            <span>Phiên bản: ${ds.current_version}</span>
          </p>
          <p class="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
            ${ds.description}
          </p>
        </div>

        <!-- Key Metrics Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/50 text-[11px]">
          <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">Số dòng</span>
            <span class="text-slate-200 font-mono font-bold">${ds.records_count.toLocaleString()}</span>
          </div>
          <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">Kích thước</span>
            <span class="text-slate-200 font-mono font-bold">${(ds.file_size_bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">Giấy phép</span>
            <span class="text-slate-200 truncate block font-medium" title="${ds.license}">${ds.license}</span>
          </div>
          <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">Mã băm SHA-256</span>
            <span class="text-cyan-400 font-mono truncate block" title="${ds.checksum_sha256}">${ds.checksum_sha256.substring(0, 12)}...</span>
          </div>
        </div>

        <!-- Card Action Footer -->
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center space-x-1.5 flex-wrap">
            ${ds.tags.map(t => `<span class="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">#${t}</span>`).join(' ')}
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="openFeedback('${ds.id}')" class="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center space-x-1 transition" title="Đánh giá độ hữu ích bài giảng">
              <i class="ph-bold ph-star text-amber-400"></i>
              <span>Đánh Giá (${ds.total_ratings})</span>
            </button>
            <button onclick="openPreview('${ds.id}')" class="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition">
              <i class="ph-bold ph-eye"></i>
              <span>Xem Trước &amp; Schema</span>
            </button>
            ${downloadBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// PREVIEW & SCHEMA INSPECTOR MODAL
// -------------------------------------------------------------
async function openPreview(datasetId) {
  try {
    const res = await fetch(`/api/v1/portal/datasets/${datasetId}/preview`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    const data = json.data;
    state.selectedDataset = data;

    modalPreviewTitle.textContent = data.dataset_name;
    modalPreviewId.textContent = data.dataset_id;
    modalPreviewTier.textContent = data.quality_tier;
    modalPreviewStatus.textContent = data.is_published ? 'Đã Xuất Bản' : 'Bản Nháp (Chưa Publish)';
    modalPreviewStatus.className = data.is_published
      ? 'text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-700'
      : 'text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-700';

    previewSha256.textContent = data.checksum_sha256;
    previewLicense.textContent = data.license;
    previewFilesize.textContent = `${(data.file_size_bytes / 1024).toFixed(1)} KB`;
    previewRecords.textContent = data.total_dataset_records.toLocaleString();

    // Render Table 1: Sample Rows
    if (data.sample_rows && data.sample_rows.length > 0) {
      const headers = Object.keys(data.sample_rows[0]);
      previewTableHead.innerHTML = `<tr>${headers.map(h => `<th class="px-4 py-2.5">${h}</th>`).join('')}</tr>`;
      previewTableBody.innerHTML = data.sample_rows.map(row => {
        return `<tr class="hover:bg-slate-800/40">${headers.map(h => `<td class="px-4 py-2 text-slate-300">${row[h] !== null ? row[h] : '<span class="text-slate-600">null</span>'}</td>`).join('')}</tr>`;
      }).join('');
    } else {
      previewTableHead.innerHTML = '';
      previewTableBody.innerHTML = '<tr><td class="p-4 text-center text-slate-500">Không có dữ liệu mẫu khả dụng</td></tr>';
    }

    // Render Table 2: Schema Inspector
    if (data.columns && data.columns.length > 0) {
      schemaTableBody.innerHTML = data.columns.map(col => `
        <tr class="hover:bg-slate-800/40">
          <td class="px-4 py-2.5 font-bold font-mono text-cyan-300">${col.name}</td>
          <td class="px-4 py-2.5 font-mono text-slate-400">${col.type}</td>
          <td class="px-4 py-2.5">
            ${col.nullable
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">Yes</span>'
              : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-900">NOT NULL</span>'}
          </td>
          <td class="px-4 py-2.5 text-slate-300">${col.description}</td>
          <td class="px-4 py-2.5 font-mono text-amber-300/90">${col.sample_value !== null ? col.sample_value : '-'}</td>
        </tr>
      `).join('');
    }

    // Download Button State inside Modal
    if (data.download_allowed) {
      btnModalDownload.disabled = false;
      btnModalDownload.className = 'px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center space-x-1.5 transition shadow-md shadow-cyan-600/20';
      btnModalDownload.innerHTML = '<i class="ph-bold ph-download-simple"></i><span>Tải Tập Dữ Liệu (.CSV)</span>';
      btnModalDownload.onclick = () => handleDownload(data.dataset_id);
    } else {
      btnModalDownload.disabled = true;
      btnModalDownload.className = 'px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800 rounded-lg flex items-center space-x-1.5 opacity-80 cursor-not-allowed';
      btnModalDownload.innerHTML = '<i class="ph-bold ph-lock-key"></i><span>Bản Nháp - Khóa Tải (DoD)</span>';
      btnModalDownload.onclick = () => handleBlockedDownload(data.dataset_id);
    }

    switchPreviewTab('rows');
    modalPreview.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to open preview modal', err);
  }
}

function switchPreviewTab(tab) {
  state.activePreviewTab = tab;
  tabBtnRows.className = tab === 'rows'
    ? 'py-3 text-cyan-400 border-b-2 border-cyan-400 flex items-center space-x-1.5'
    : 'py-3 text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5';
  tabBtnSchema.className = tab === 'schema'
    ? 'py-3 text-cyan-400 border-b-2 border-cyan-400 flex items-center space-x-1.5'
    : 'py-3 text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5';
  tabBtnIntegrity.className = tab === 'integrity'
    ? 'py-3 text-cyan-400 border-b-2 border-cyan-400 flex items-center space-x-1.5'
    : 'py-3 text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5';

  tabContentRows.classList.toggle('hidden', tab !== 'rows');
  tabContentSchema.classList.toggle('hidden', tab !== 'schema');
  tabContentIntegrity.classList.toggle('hidden', tab !== 'integrity');
}

// -------------------------------------------------------------
// DOWNLOAD HANDLERS & ACCESS RULES ENFORCEMENT
// -------------------------------------------------------------
function handleDownload(datasetId) {
  const url = `/api/v1/portal/datasets/${datasetId}/download`;
  window.open(url, '_blank');
}

function handleBlockedDownload(datasetId) {
  alert(
    `[ACCESS RULES VÀ TIÊU CHÍ NGHIỆM THU DoD]\n\n` +
    `Hệ thống CyberSoft Data & AI Lab từ chối yêu cầu tải tập dữ liệu '${datasetId}'.\n\n` +
    `Lý do: Bộ dữ liệu đang ở trạng thái BẢN NHÁP (Draft / Review) chưa được phê duyệt phát hành chính thức.\n` +
    `Mã phản hồi API: 403 Forbidden (DATASET_UNPUBLISHED_RESTRICTED).`
  );
}

// -------------------------------------------------------------
// FEEDBACK MODAL (1-5 STARS USEFULNESS)
// -------------------------------------------------------------
async function openFeedback(datasetId) {
  state.selectedDatasetId = datasetId;
  feedbackDatasetTitle.textContent = datasetId;
  setRating(5);
  feedbackComment.value = '';

  await loadFeedbackSummary(datasetId);
  modalFeedback.classList.remove('hidden');
}

async function loadFeedbackSummary(datasetId) {
  try {
    const res = await fetch(`/api/v1/portal/datasets/${datasetId}/feedback`);
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      feedbackStatsBadge.textContent = `${d.average_rating} / 5.0 (${d.total_ratings} đánh giá)`;
      if (d.reviews && d.reviews.length > 0) {
        feedbackReviewsList.innerHTML = d.reviews.map(r => `
          <div class="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-200 text-xs">${r.reviewer_name} <span class="text-slate-500 font-normal">(${r.role})</span></span>
              <div class="text-amber-400 flex items-center space-x-0.5">
                ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
              </div>
            </div>
            <p class="text-slate-300 text-xs">${r.comment}</p>
          </div>
        `).join('');
      } else {
        feedbackReviewsList.innerHTML = '<p class="text-slate-500 text-center py-3">Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét!</p>';
      }
    }
  } catch (err) {
    console.warn('Failed to load feedback summary', err);
  }
}

function setRating(val) {
  state.currentRating = val;
  const stars = starPicker.querySelectorAll('i');
  stars.forEach((star, idx) => {
    if (idx < val) {
      star.className = 'ph-fill ph-star hover:scale-110 transition text-amber-400';
    } else {
      star.className = 'ph ph-star hover:scale-110 transition text-slate-600';
    }
  });
  starLabel.textContent = ratingLabels[val] || `${val} / 5 Sao`;
}

async function submitFeedback() {
  const comment = feedbackComment.value.trim();
  if (comment.length < 5) {
    alert('Vui lòng nhập nhận xét ít nhất 5 ký tự để đội ngũ CyberSoft tiếp thu ý kiến!');
    return;
  }

  const payload = {
    rating: state.currentRating,
    reviewer_name: feedbackName.value.trim() || 'Giảng viên CyberSoft',
    role: feedbackRole.value,
    comment: comment,
    usefulness_aspects: ['clean_data', 'pedagogy_ready'],
  };

  try {
    const res = await fetch(`/api/v1/portal/datasets/${state.selectedDatasetId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      alert('Đã gửi đánh giá độ hữu ích thành công! Cảm ơn đóng góp của bạn.');
      feedbackComment.value = '';
      await loadFeedbackSummary(state.selectedDatasetId);
      await fetchDatasets();
      await fetchGlobalStats();
    } else {
      alert('Lỗi: ' + (json.error?.message || 'Không thể lưu feedback'));
    }
  } catch (err) {
    console.error('Submit feedback failed', err);
    alert('Lỗi gửi đánh giá đến máy chủ.');
  }
}

// -------------------------------------------------------------
// USABILITY BENCHMARK (5 SCENARIOS)
// -------------------------------------------------------------
async function runUsabilityBenchmark() {
  modalUsability.classList.remove('hidden');
  usabilityResultsList.innerHTML = `
    <div class="text-center py-8 text-indigo-300">
      <div class="inline-block animate-spin text-2xl mb-2"><i class="ph ph-spinner-gap"></i></div>
      <p class="text-xs">Đang thực thi 5 kịch bản kiểm thử độ khả dụng của Giảng viên...</p>
    </div>`;
  usabilityOverallSummary.classList.add('hidden');

  try {
    const res = await fetch('/api/v1/portal/usability-benchmark', { method: 'POST' });
    const json = await res.json();

    if (json.success && json.data) {
      const list = json.data;
      let totalElapsed = 0;

      usabilityResultsList.innerHTML = list.map(item => {
        totalElapsed += item.elapsed_seconds;
        return `
          <div class="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-700 flex items-center justify-center font-bold text-xs">
                  ${item.scenario_id}
                </span>
                <span class="text-xs font-bold text-white">${item.scenario_name}</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                <i class="ph-bold ph-check"></i>
                <span>${item.status} (${item.elapsed_seconds}s)</span>
              </span>
            </div>
            <p class="text-[11px] text-slate-300"><strong class="text-slate-400">Mục tiêu:</strong> ${item.user_goal}</p>
            <div class="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800 font-mono">
               ${item.verification_evidence}
            </div>
          </div>
        `;
      }).join('');

      usabilityTotalTime.textContent = `${totalElapsed.toFixed(3)}s / Ngưỡng &lt; 60s`;
      usabilityOverallSummary.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Benchmark execution error', err);
    usabilityResultsList.innerHTML = `<p class="text-xs text-red-400 text-center py-4">Lỗi chạy kịch bản tự động hóa.</p>`;
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS INITIALIZATION
// -------------------------------------------------------------
function initEventListeners() {
  // Live Search Input (Debounced)
  searchInput.addEventListener('input', () => {
    btnClearSearch.classList.toggle('hidden', searchInput.value.length === 0);
    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = setTimeout(() => {
      fetchDatasets();
    }, 200);
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');
    fetchDatasets();
  });

  // Filters change
  filterStatus.addEventListener('change', fetchDatasets);
  filterDomain.addEventListener('change', fetchDatasets);
  filterLevel.addEventListener('change', fetchDatasets);
  filterLicense.addEventListener('change', fetchDatasets);

  // Reset Filters
  btnResetFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterStatus.value = 'all';
    filterDomain.value = 'all';
    filterLevel.value = 'all';
    filterLicense.value = 'all';
    btnClearSearch.classList.add('hidden');
    fetchDatasets();
  });

  // Preview Tabs
  tabBtnRows.addEventListener('click', () => switchPreviewTab('rows'));
  tabBtnSchema.addEventListener('click', () => switchPreviewTab('schema'));
  tabBtnIntegrity.addEventListener('click', () => switchPreviewTab('integrity'));

  // Close Modals
  btnClosePreview.addEventListener('click', () => modalPreview.classList.add('hidden'));
  btnModalClose.addEventListener('click', () => modalPreview.classList.add('hidden'));
  btnCloseFeedback.addEventListener('click', () => modalFeedback.classList.add('hidden'));
  btnCloseUsability.addEventListener('click', () => modalUsability.classList.add('hidden'));

  // Copy SHA-256
  btnCopySha256.addEventListener('click', () => {
    navigator.clipboard.writeText(previewSha256.textContent);
    alert('Đã sao chép mã SHA-256 vào bộ nhớ tạm!');
  });

  // Star Rating Picker
  starPicker.addEventListener('click', (e) => {
    const star = e.target.closest('i');
    if (star && star.dataset.star) {
      setRating(parseInt(star.dataset.star, 10));
    }
  });

  // Submit Feedback
  btnSubmitFeedback.addEventListener('click', submitFeedback);

  // Run Usability Benchmark
  btnRunUsability.addEventListener('click', runUsabilityBenchmark);
  btnTriggerBenchmark.addEventListener('click', runUsabilityBenchmark);
}

// Startup
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  fetchDatasets();
  fetchGlobalStats();
});
