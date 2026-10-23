const chatBox = document.getElementById('chatBox');
const queryInput = document.getElementById('queryInput');
const btnSend = document.getElementById('btnSend');

function setPrompt(text) {
  queryInput.value = text;
  queryInput.focus();
}

function appendUserMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message user';
  msgDiv.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendTutorResponse(data) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message tutor';

  let badgeClass = 'badge-answered';
  if (data.status === 'ABSTAIN') badgeClass = 'badge-abstain';
  if (data.status === 'GUARD_BLOCKED') badgeClass = 'badge-blocked';

  let citationsHtml = '';
  if (data.citations && data.citations.length > 0) {
    citationsHtml = `
      <div class="citations-box">
        <div style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-top: 0.25rem;">
          Nguồn trích dẫn chính thức (${data.citations.length} chunks):
        </div>
        ${data.citations.map(c => `
          <div class="citation-card">
            <div class="citation-header">
              <span>[${c.chunk_id}] ${escapeHtml(c.section_title)}</span>
              <span>${c.document_code}</span>
            </div>
            <div class="citation-quote">"${escapeHtml(c.exact_quote)}"</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  let abstainHtml = '';
  if (data.abstain_reason) {
    abstainHtml = `
      <div style="font-size: 0.8rem; color: #f59e0b; margin-top: 0.35rem;">
        <strong>Lý do từ chối:</strong> ${escapeHtml(data.abstain_reason)}
      </div>
    `;
  }

  msgDiv.innerHTML = `
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <span class="badge-tag ${badgeClass}">${data.status}</span>
      <span style="font-size: 0.8rem; color: #94a3b8;">CyberSoft AI Tutor</span>
    </div>
    <div class="bubble">
      ${escapeHtml(data.answer)}
      ${abstainHtml}
      ${citationsHtml}
      <div class="meta-stats">
        <span>Độ tin cậy: ${(data.confidence_score * 100).toFixed(1)}%</span>
        <span>Độ trễ: ${data.latency_ms} ms</span>
        <span>Guardrail: ${data.guardrail_status?.passed ? 'An toàn' : 'Kích hoạt chặn'}</span>
      </div>
    </div>
  `;

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendQuery() {
  const query = queryInput.value.trim();
  if (!query) return;

  appendUserMessage(query);
  queryInput.value = '';
  btnSend.disabled = true;

  try {
    const res = await fetch('/api/v1/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query, top_k: 3 })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Lỗi kết nối máy chủ');
    }

    const data = await res.json();
    appendTutorResponse(data);
  } catch (err) {
    appendTutorResponse({
      status: 'GUARD_BLOCKED',
      answer: `Lỗi kết nối API: ${err.message}`,
      citations: [],
      confidence_score: 0.0,
      abstain_reason: err.message,
      guardrail_status: { passed: false, triggered_rules: ['network_error'] },
      latency_ms: 0.0
    });
  } finally {
    btnSend.disabled = false;
    queryInput.focus();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendQuery();
  }
});
