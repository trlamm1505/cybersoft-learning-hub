"""
Giải pháp Baseline cho Capstone AI-01 (Baseline Naive RAG)
Đặc điểm:
- Phân đoạn cố định (fixed chunk 500 ký tự).
- Chỉ dùng TF-IDF / Cosine Similarity đơn lẻ.
- Không có cơ chế từ chối (Abstain Guardrail), cố gắng trả lời mọi câu hỏi.
- Dẫn đến tình trạng hallucination cao trên tập unanswerable và distractor.
"""

import os
import time
from typing import Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class BaselineRAGPipeline:
    def __init__(self, corpus_dir: str):
        self.corpus_dir = corpus_dir
        self.chunks = []
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
        self.tfidf_matrix = None
        self._ingest_fixed_chunks()
        self._build_index()

    def _ingest_fixed_chunks(self, chunk_size: int = 500, overlap: int = 50):
        """Phân đoạn cố định theo số ký tự (Naive Fixed Chunking)."""
        files = [f for f in os.listdir(self.corpus_dir) if f.endswith(".md")]
        for filename in files:
            doc_id = filename.split("_")[0]
            filepath = os.path.join(self.corpus_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Cắt chuỗi cố định
            start = 0
            chunk_idx = 0
            while start < len(content):
                end = min(start + chunk_size, len(content))
                chunk_text = content[start:end].strip()
                if chunk_text:
                    self.chunks.append(
                        {
                            "chunk_id": f"{doc_id}_chunk_{chunk_idx}",
                            "doc_id": doc_id,
                            "text": chunk_text,
                        }
                    )
                    chunk_idx += 1
                start += chunk_size - overlap

    def _build_index(self):
        corpus_texts = [c["text"] for c in self.chunks]
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus_texts)

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Truy xuất đơn thuần bằng Cosine Similarity."""
        query_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(query_vec, self.tfidf_matrix)[0]
        top_indices = np.argsort(sims)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append(
                {
                    "chunk_id": self.chunks[idx]["chunk_id"],
                    "doc_id": self.chunks[idx]["doc_id"],
                    "text": self.chunks[idx]["text"],
                    "score": float(sims[idx]),
                }
            )
        return results

    def generate(
        self, query: str, retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Tạo câu trả lời Baseline:
        Không có bộ lọc từ chối (No Abstention), trả về đoạn có similarity cao nhất.
        """
        top_chunk = retrieved_chunks[0] if retrieved_chunks else None

        # Baseline cố gắng trả lời và không kiểm tra ngưỡng tự tin
        if not top_chunk or top_chunk["score"] < 0.05:
            answer = (
                "Thông tin không rõ ràng nhưng có thể tham khảo chính sách CyberSoft."
            )
            citations = [top_chunk["doc_id"]] if top_chunk else []
            abstained = False
        else:
            # Lấy 2 dòng đầu của top chunk làm câu trả lời tóm tắt
            lines = [
                line.strip() for line in top_chunk["text"].split("\n") if line.strip()
            ]
            summary = " ".join(lines[:2])
            answer = f"Theo quy định: {summary}"
            # Trích dẫn đơn giản tên tài liệu, không có section_id
            citations = [top_chunk["doc_id"]]
            abstained = False

        return {"answer": answer, "citations": citations, "abstained": abstained}

    def process_query(self, query: str) -> Dict[str, Any]:
        t0 = time.time()
        chunks = self.retrieve(query, top_k=5)
        gen = self.generate(query, chunks)
        latency = (time.time() - t0) * 1000.0

        return {
            "query": query,
            "answer": gen["answer"],
            "citations": gen["citations"],
            "abstained": gen["abstained"],
            "latency_ms": round(latency, 2),
            "retrieved_chunks": chunks,
        }
