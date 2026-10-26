"""Endpoints for Dataset Registry and Project Bank."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse

from ..auth import require_roles
from ..schemas.common import SuccessEnvelope
from ..schemas.registry import (
    DatasetDetail,
    DatasetListResponse,
    EvaluationSetDetail,
    EvaluationSetListResponse,
    ProjectDetail,
    ProjectListResponse,
    TableDataResponse,
    TableListResponse,
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


@router.get(
    "/evaluation-sets",
    response_model=SuccessEnvelope[EvaluationSetListResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách các bộ kiểm định chuẩn (Evaluation Sets)",
    description="Trả về danh mục các bộ dữ liệu benchmark dùng để chấm điểm tự động các bài thực hành RAG và SQL trong AI Lab.",
)
def list_evaluation_sets(
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[EvaluationSetListResponse]:
    data = RegistryService.list_evaluation_sets()
    return SuccessEnvelope(data=data)


@router.get(
    "/evaluation-sets/{eval_set_id}",
    response_model=SuccessEnvelope[EvaluationSetDetail],
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết bộ câu hỏi kiểm định kèm ground-truth (AI Lab)",
    description="Trả về danh sách câu hỏi kiểm thử gồm question_id, query, ground_truth_answer, expected_behavior phục vụ chấm điểm tự động AI Lab.",
)
def get_evaluation_set_detail(
    eval_set_id: str,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[EvaluationSetDetail]:
    detail = RegistryService.get_evaluation_set(eval_set_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "EVALUATION_SET_NOT_FOUND",
                "message": f"Không tìm thấy bộ đánh giá với mã '{eval_set_id}' trong Evaluation Store.",
                "details": [
                    {
                        "field": "eval_set_id",
                        "issue": "Resource does not exist in evaluation sets store",
                    }
                ],
            },
        )
    return SuccessEnvelope(data=detail)


@router.get(
    "/datasets/{dataset_id}/tables",
    response_model=SuccessEnvelope[TableListResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách các bảng trong dataset",
    description="Trả về danh mục các bảng dữ liệu có thể trích xuất hoặc nạp vào Postgres Sandbox.",
)
def list_dataset_tables(
    dataset_id: str,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[TableListResponse]:
    tables = RegistryService.list_dataset_tables(dataset_id)
    if not tables:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "DATASET_NOT_FOUND",
                "message": f"Không tìm thấy dataset với mã '{dataset_id}' để liệt kê bảng.",
                "details": [
                    {
                        "field": "dataset_id",
                        "issue": "Resource does not exist in dataset store",
                    }
                ],
            },
        )
    return SuccessEnvelope(data=tables)


@router.get(
    "/datasets/{dataset_id}/tables/{table_name}",
    response_model=SuccessEnvelope[TableDataResponse],
    status_code=status.HTTP_200_OK,
    summary="Lấy dữ liệu từng bảng của dataset (phân trang hoặc tải tệp CSV)",
    description="Hỗ trợ phân trang hoặc tải dạng file CSV, trả kèm current_version, checksum_sha256 và thông báo rõ ràng bản được cấp là 'clean' (chuẩn sạch nạp DB) hay 'dirty' (kiểm thử).",
)
def get_dataset_table_data(
    dataset_id: str,
    table_name: str,
    variant: str = Query(
        "clean",
        description="Bản dữ liệu: 'clean' (chuẩn sạch nạp Postgres Sandbox) hoặc 'dirty' (bản kiểm thử)",
    ),
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    page_size: int = Query(50, ge=1, le=500, description="Số lượng bản ghi mỗi trang"),
    download: bool = Query(
        False,
        description="Tải trực tiếp dưới dạng tệp CSV đính kèm header checksum và version",
    ),
    format_type: str = Query(
        "json",
        alias="format",
        description="Định dạng kết quả trả về ('json' hoặc 'csv')",
    ),
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
):
    clean_variant = variant.lower().strip()
    if clean_variant not in ["clean", "dirty"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_VARIANT",
                "message": f"Tham số variant '{variant}' không hợp lệ. Chỉ chấp nhận 'clean' hoặc 'dirty'.",
                "details": [
                    {
                        "field": "variant",
                        "issue": "Must be 'clean' or 'dirty'",
                    }
                ],
            },
        )

    ds = RegistryService.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "DATASET_NOT_FOUND",
                "message": f"Không tìm thấy dataset với mã '{dataset_id}'.",
                "details": [
                    {
                        "field": "dataset_id",
                        "issue": "Resource does not exist in dataset store",
                    }
                ],
            },
        )

    if download or format_type.lower() == "csv":
        info = RegistryService.get_table_file_info(
            dataset_id, table_name, clean_variant
        )
        if not info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "TABLE_NOT_FOUND",
                    "message": f"Không tìm thấy bảng '{table_name}' trong dataset '{dataset_id}' với bản '{clean_variant}'.",
                    "details": [
                        {
                            "field": "table_name",
                            "issue": "Table file does not exist",
                        }
                    ],
                },
            )
        headers = {
            "X-Current-Version": info["current_version"],
            "X-Checksum-SHA256": info["checksum_sha256"],
            "X-Data-Variant": info["variant"],
            "X-Total-Rows": str(info["total_rows"]),
        }
        return FileResponse(
            path=str(info["file_path"]),
            filename=info["filename"],
            media_type="text/csv",
            headers=headers,
        )

    table_data = RegistryService.get_table_data(
        dataset_id, table_name, clean_variant, page, page_size
    )
    if not table_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "TABLE_NOT_FOUND",
                "message": f"Không tìm thấy bảng '{table_name}' trong dataset '{dataset_id}' với bản '{clean_variant}'.",
                "details": [
                    {
                        "field": "table_name",
                        "issue": "Table data does not exist",
                    }
                ],
            },
        )
    return SuccessEnvelope(data=table_data)
