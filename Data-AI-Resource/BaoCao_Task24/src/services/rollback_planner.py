"""Rollback Planner & Rollback Note Generator Service.

Generates rigorous, step-by-step rollback plans to safely revert
to an earlier release without losing immutable historical artifacts.
"""

from typing import Optional
from src.schemas.lifecycle import RollbackPlan, RollbackRequest, RollbackStep
from src.services.changelog_differ import ChangelogDiffer
from src.services.manifest_builder import ManifestBuilder, manifest_builder


class RollbackPlanner:
    def __init__(self, builder: Optional[ManifestBuilder] = None):
        self.builder = builder or manifest_builder

    def generate_plan(self, req: RollbackRequest) -> RollbackPlan:
        """Generates a complete rollback plan and official Rollback Note."""
        current_manifest = self.builder.get_manifest(req.current_release_id)
        target_manifest = self.builder.get_manifest(req.target_release_id)

        # Compute diff from target to current (reverse)
        diff = ChangelogDiffer.compare_releases(
            base=target_manifest, target=current_manifest
        )

        steps: list[RollbackStep] = []
        step_idx = 1

        # 1. Traffic drain / Gateway pointer step
        steps.append(
            RollbackStep(
                step_number=step_idx,
                component="API Gateway & Route Registry",
                action="revert_pointer",
                detail=f"Chuyển con trỏ định tuyến hệ thống từ phiên bản {current_manifest.version} về {target_manifest.version}.",
                target_version=target_manifest.version,
                verification_command=f"curl -s http://localhost:8000/api/v1/releases/manifests/{target_manifest.release_id}",
            )
        )
        step_idx += 1

        # 2. Revert modified components
        for item in diff.updated:
            old_ver = item.old_version or "v1.0.0"
            steps.append(
                RollbackStep(
                    step_number=step_idx,
                    component=f"{item.artifact_type.value.capitalize()}: {item.name}",
                    action="restore_version_pointer",
                    detail=f"Khôi phục con trỏ cấu hình của '{item.name}' từ phiên bản {item.new_version} về {old_ver}.",
                    target_version=old_ver,
                    verification_command=f"python scripts/run_lineage_eval.py --verify-artifact {item.artifact_id}",
                )
            )
            step_idx += 1

        # 3. Handle added components (must be isolated or demoted)
        for item in diff.added:
            steps.append(
                RollbackStep(
                    step_number=step_idx,
                    component=f"{item.artifact_type.value.capitalize()}: {item.name}",
                    action="demote_to_draft",
                    detail=f"Cách ly và chuyển trạng thái tài nguyên mới sinh {item.artifact_id} về chế độ dự phòng.",
                    target_version="quarantine",
                    verification_command=f"python scripts/run_lineage_eval.py --check-quarantine {item.artifact_id}",
                )
            )
            step_idx += 1

        # 4. Cache & Index verification
        steps.append(
            RollbackStep(
                step_number=step_idx,
                component="Vector Index & Query Cache",
                action="flush_and_sync",
                detail=f"Đồng bộ lại chỉ mục tìm kiếm và xóa cache bộ nhớ tạm tương thích với bản phát hành {target_manifest.version}.",
                target_version=target_manifest.version,
                verification_command="pytest tests/test_provenance_trace.py -v",
            )
        )

        preflight = [
            f"Xác thực tính toàn vẹn của Release Manifest đích: {target_manifest.holistic_checksum}",
            f"Xác nhận toàn bộ {len(target_manifest.components)} tài nguyên mục tiêu vẫn nguyên vẹn trong WORM store",
            "Đảm bảo không có tiến trình huấn luyện hoặc đánh giá nào đang ghi dữ liệu",
            f"Sao lưu snapshot trạng thái cấu hình hiện tại của {current_manifest.version}",
        ]

        post_tests = [
            f"Chạy kiểm thử hợp đồng API trên bản {target_manifest.version}",
            "Kiểm tra tính truy vết nguồn gốc (backtrace) 100% đến dataset nguồn",
            "Xác nhận tỷ lệ phản hồi HTTP 200 OK trên các cổng tra cứu tài nguyên",
        ]

        # Render markdown Rollback Note without forbidden terms
        lines = [
            f"# TÀI LIỆU HƯỚNG DẪN HOÀN TÁC (ROLLBACK NOTE): {current_manifest.version} ➔ {target_manifest.version}",
            "",
            f"**Mã kế hoạch**: `PLN-ROLLBACK-{current_manifest.version}-{target_manifest.version}`  ",
            f"**Người thực hiện**: {req.operator}  ",
            f"**Lý do thực hiện**: {req.reason}  ",
            "**Mức độ rủi ro**: LOW (Do toàn bộ tài nguyên được lưu trữ bất biến theo cơ chế WORM)  ",
            f"**Phiên bản hiện tại**: `{current_manifest.version}` (`{current_manifest.release_id}`)  ",
            f"**Phiên bản đích**: `{target_manifest.version}` (`{target_manifest.release_id}`)  ",
            f"**Mã kiểm tra toàn vẹn đích**: `{target_manifest.holistic_checksum}`  ",
            "",
            "---",
            "",
            "## 1. Kiểm tra Tiên quyết (Pre-flight Checklist)",
            "",
        ]
        for c in preflight:
            lines.append(f"- [ ] {c}")

        lines.extend(
            [
                "",
                "## 2. Các Bước Thực Thi Khôi Phục (Execution Steps)",
                "",
                "| Bước | Thành Phần | Hành Động | Chi Tiết | Phiên Bản Đích | Lệnh Kiểm Chứng |",
                "| :--- | :--- | :--- | :--- | :--- | :--- |",
            ]
        )
        for s in steps:
            lines.append(
                f"| {s.step_number} | {s.component} | `{s.action}` | {s.detail} | `{s.target_version}` | `{s.verification_command}` |"
            )

        lines.extend(
            [
                "",
                "## 3. Kiểm Thử Nghiệm Thu Sau Hoàn Tác (Post-Rollback Verification)",
                "",
            ]
        )
        for t in post_tests:
            lines.append(f"- [ ] {t}")

        md_content = "\n".join(lines)

        return RollbackPlan(
            plan_id=f"plan_rollback_{target_manifest.version}",
            from_release_id=current_manifest.release_id,
            to_release_id=target_manifest.release_id,
            risk_level="LOW",
            preflight_checks=preflight,
            affected_components_count=diff.total_changes,
            steps=steps,
            post_rollback_tests=post_tests,
            markdown_note=md_content,
        )


rollback_planner = RollbackPlanner()
