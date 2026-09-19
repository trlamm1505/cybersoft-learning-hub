"""Packager for Student Edition vs Instructor Edition."""

import copy
import json
import os
import shutil
from pathlib import Path
from typing import Any, Dict


class ProjectPackager:
    """Handles segregation and packaging of student vs instructor project bundles."""

    def __init__(self, project_dir: Path):
        self.project_dir = Path(project_dir).resolve()
        self.manifest_path = self.project_dir / "project_manifest.json"

    def sanitize_manifest_for_student(self, manifest: Dict[str, Any]) -> Dict[str, Any]:
        """Strip sensitive solution keys, ground-truth expected KPI values from manifest."""
        student_manifest = copy.deepcopy(manifest)

        # Sanitize KPIs: Keep formula and tolerance, remove explicit expected_value
        if "kpis" in student_manifest:
            for kpi in student_manifest["kpis"].get("business_kpis", []):
                kpi["expected_value"] = None
            for kpi in student_manifest["kpis"].get("technical_kpis", []):
                kpi["expected_value"] = None

        student_manifest["metadata"]["edition"] = "student"
        return student_manifest

    def package(self, output_base_dir: Path) -> Dict[str, Path]:
        """Package the project into student_edition and instructor_edition."""
        output_base_dir = Path(output_base_dir).resolve()
        student_dest = output_base_dir / "student_edition"
        instructor_dest = output_base_dir / "instructor_edition"

        os.makedirs(student_dest, exist_ok=True)
        os.makedirs(instructor_dest, exist_ok=True)

        # 1. Copy student resources
        student_src = self.project_dir / "student_edition"
        if student_src.exists():
            shutil.copytree(student_src, student_dest, dirs_exist_ok=True)

        # 2. Copy instructor resources
        instructor_src = self.project_dir / "instructor_edition"
        if instructor_src.exists():
            shutil.copytree(instructor_src, instructor_dest, dirs_exist_ok=True)

        # 3. Write sanitized student manifest and full instructor manifest
        if self.manifest_path.exists():
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                full_manifest = json.load(f)

            student_manifest = self.sanitize_manifest_for_student(full_manifest)
            with open(
                student_dest / "project_manifest.json", "w", encoding="utf-8"
            ) as f:
                json.dump(student_manifest, f, indent=2, ensure_ascii=False)

            with open(
                instructor_dest / "project_manifest.json", "w", encoding="utf-8"
            ) as f:
                json.dump(full_manifest, f, indent=2, ensure_ascii=False)

        return {"student_dir": student_dest, "instructor_dir": instructor_dest}
