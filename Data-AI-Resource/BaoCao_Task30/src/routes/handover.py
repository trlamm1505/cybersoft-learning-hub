"""Định tuyến API Nghiệm thu Bàn giao và Kiểm tra Sức khỏe Hệ thống (Task 30).

File này làm gì:
- Cung cấp các điểm cuối RESTful để kiểm tra sức khỏe (/health), lấy tóm tắt nghiệm thu (/summary),
  danh mục dataset, capstone, chỉ số SLA kỹ thuật, lỗi đã biết và chạy kiểm chứng tự động toàn diện (/verify-all).

Nhận vào:
- Yêu cầu HTTP GET/POST từ Dashboard nghiệm thu hoặc script kiểm định.

Trả ra:
- Dữ liệu JSON chứa kết quả đối soát tiêu chuẩn nghiệm thu, chỉ số SLA và danh mục bàn giao.
"""

import os
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter
import psutil

from src.schemas.handover import (
    HandoverSummary,
    DatasetItem,
    CapstoneItem,
    SLABenchmarks,
    KnownIssue,
    RoadmapPhase,
    VerificationResult
)
from src.services.handover_service import handover_service

health_router = APIRouter(prefix="/api/v1", tags=["Health"])
router = APIRouter(prefix="/api/v1/handover", tags=["Handover"])


@health_router.get("/health")
def healthcheck():
    """Kiểm tra sức khỏe dịch vụ và lượng RAM chiếm dụng."""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    memory_rss_mb = round(memory_info.rss / (1024 * 1024), 2)

    return {
        "status": "UP",
        "service": "CyberSoft Data & AI Lab — Handover Service (Task 30)",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "memory_rss_mb": memory_rss_mb,
        "release_status": "READY_FOR_RELEASE",
        "http_code": 200
    }


@router.get("/summary", response_model=HandoverSummary)
def get_handover_summary():
    """Trả về báo cáo tổng kết toàn bộ 30 ngày thực tập."""
    return handover_service.get_summary()


@router.get("/datasets", response_model=List[DatasetItem])
def get_datasets_registry():
    """Lấy danh mục 4 bộ dữ liệu chuẩn 3NF."""
    return handover_service.get_datasets()


@router.get("/capstones", response_model=List[CapstoneItem])
def get_capstones():
    """Lấy danh mục 2 dự án tốt nghiệp Data Analyst & AI Engineer."""
    return handover_service.get_capstones()


@router.get("/sla-benchmarks", response_model=SLABenchmarks)
def get_sla_benchmarks():
    """Lấy cam kết chỉ số kỹ thuật SLA."""
    return handover_service.get_sla_benchmarks()


@router.get("/known-issues", response_model=List[KnownIssue])
def get_known_issues():
    """Lấy danh mục giới hạn tồn đọng và giải pháp tạm thời."""
    return handover_service.get_known_issues()


@router.get("/roadmap", response_model=List[RoadmapPhase])
def get_roadmap():
    """Lấy lộ trình phát triển 60 ngày tiếp theo."""
    return handover_service.get_roadmap()


@router.post("/verify-all", response_model=VerificationResult)
def verify_all_handover_criteria():
    """Chạy kiểm chứng tự động toàn bộ 6 tiêu chí bàn giao nghiệm thu."""
    return handover_service.run_verification()
