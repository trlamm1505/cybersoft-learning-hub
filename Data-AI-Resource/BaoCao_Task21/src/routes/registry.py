"""Endpoints for Dataset Registry and Project Bank."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth import require_roles
from ..schemas.common import SuccessEnvelope
from ..schemas.registry import (
    DatasetDetail,
    DatasetListResponse,
    ProjectDetail,
    ProjectListResponse,
)
from ..services.registry_service import RegistryService

router = APIRouter(prefix="/registry", tags=["Dataset Registry & Projects"])


@router.get(
    "/datasets",
    response_model=SuccessEnvelope[DatasetListResponse],
    status_code=status.HTTP_200_OK,
    summary="Tra cứu danh sách datasets trong Registry",
    description="Hỗ trợ lọc theo domain, độ khó, định dạng tệp, tag và hỗ trợ phân trang.",
)
def list_datasets(
    domain: str | None = Query(
        None,
        description="Lọc theo lĩnh vực (Retail, HR/Operations, NLP/RAG, Education)",
    ),
    difficulty: str | None = Query(
        None,
        alias="difficulty_level",
        description="Lọc theo độ khó (beginner, intermediate, advanced)",
    ),
    format_type: str | None = Query(
        None, alias="format", description="Lọc theo định dạng tệp (csv, json, jsonl)"
    ),
    tag: str | None = Query(None, description="Lọc theo thẻ phân loại"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng bản ghi tối đa trả về"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[DatasetListResponse]:
    data = RegistryService.list_datasets(
        domain=domain,
        difficulty_level=difficulty,
        format_type=format_type,
        tag=tag,
        limit=limit,
        offset=offset,
    )
    return SuccessEnvelope(data=data)


@router.get(
    "/datasets/{dataset_id}",
    response_model=SuccessEnvelope[DatasetDetail],
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết metadata và lược đồ của một dataset",
    description="Trả về thông tin chi tiết, schema cột, mã băm SHA-256 và mẫu preview 3 dòng đầu.",
)
def get_dataset_detail(
    dataset_id: str,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[DatasetDetail]:
    detail = RegistryService.get_dataset(dataset_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "DATASET_NOT_FOUND",
                "message": f"Không tìm thấy dataset với mã định danh '{dataset_id}' trong Dataset Registry.",
                "details": [
                    {
                        "field": "dataset_id",
                        "issue": "Resource does not exist in registry store",
                    }
                ],
            },
        )
    return SuccessEnvelope(data=detail)


@router.get(
    "/projects",
    response_model=SuccessEnvelope[ProjectListResponse],
    status_code=status.HTTP_200_OK,
    summary="Tra cứu danh mục đề án Capstone học viên",
    description="Trả về danh sách các đề tài thực hành lớn (Data Analyst, AI Engineer) và tiêu chí chấm điểm.",
)
def list_projects(
    track: str | None = Query(
        None, description="Lọc theo chuyên ngành (Data Analyst, AI Engineer)"
    ),
    difficulty: str | None = Query(None, description="Lọc theo độ khó"),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[ProjectListResponse]:
    data = RegistryService.list_projects(
        track=track,
        difficulty=difficulty,
        limit=limit,
        offset=offset,
    )
    return SuccessEnvelope(data=data)


@router.get(
    "/projects/{project_id}",
    response_model=SuccessEnvelope[ProjectDetail],
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết yêu cầu và rubric chấm điểm của đề án Capstone",
    description="Cung cấp mục tiêu đầu ra, danh sách deliverables và tỷ trọng rubric chấm bài.",
)
def get_project_detail(
    project_id: str,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[ProjectDetail]:
    detail = RegistryService.get_project(project_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PROJECT_NOT_FOUND",
                "message": f"Không tìm thấy đề án với mã định danh '{project_id}' trong Project Bank.",
                "details": [
                    {
                        "field": "project_id",
                        "issue": "Resource does not exist in project store",
                    }
                ],
            },
        )
    return SuccessEnvelope(data=detail)
