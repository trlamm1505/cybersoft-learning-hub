"""Changelog Differ Service.

Compares Release Manifests to generate machine-readable diffs
and clean, human-readable changelog release notes.
"""

from src.schemas.artifact import LifecycleState
from src.schemas.manifest import (
    ChangelogItem,
    ChangelogReleaseEntry,
    ComponentDiffItem,
    ReleaseDiff,
    ReleaseManifest,
)


class ChangelogDiffer:
    @staticmethod
    def compare_releases(base: ReleaseManifest, target: ReleaseManifest) -> ReleaseDiff:
        """Calculates difference between base and target release manifests."""
        added: list[ComponentDiffItem] = []
        updated: list[ComponentDiffItem] = []
        deprecated: list[ComponentDiffItem] = []
        retired: list[ComponentDiffItem] = []
        unchanged_count = 0

        base_keys = set(base.components.keys())

        # Check newly added or updated
        for key, t_comp in target.components.items():
            if key not in base_keys:
                added.append(
                    ComponentDiffItem(
                        artifact_id=t_comp.artifact_id,
                        name=t_comp.name,
                        artifact_type=t_comp.artifact_type,
                        new_version=t_comp.version,
                        change_type="added",
                        summary=f"Thêm mới tài nguyên {t_comp.artifact_type.value} '{t_comp.name}' phiên bản {t_comp.version}.",
                    )
                )
            else:
                b_comp = base.components[key]
                # Compare versions / hashes / state
                if (
                    b_comp.version != t_comp.version
                    or b_comp.content_hash != t_comp.content_hash
                ):
                    updated.append(
                        ComponentDiffItem(
                            artifact_id=t_comp.artifact_id,
                            name=t_comp.name,
                            artifact_type=t_comp.artifact_type,
                            old_version=b_comp.version,
                            new_version=t_comp.version,
                            change_type="updated",
                            summary=f"Nâng cấp {t_comp.name} từ {b_comp.version} lên {t_comp.version}.",
                        )
                    )
                elif b_comp.state != t_comp.state:
                    if t_comp.state == LifecycleState.DEPRECATED:
                        deprecated.append(
                            ComponentDiffItem(
                                artifact_id=t_comp.artifact_id,
                                name=t_comp.name,
                                artifact_type=t_comp.artifact_type,
                                old_version=b_comp.version,
                                new_version=t_comp.version,
                                change_type="deprecated",
                                summary=f"Đánh dấu deprecate {t_comp.name} {t_comp.version}.",
                            )
                        )
                    elif t_comp.state == LifecycleState.RETIRED:
                        retired.append(
                            ComponentDiffItem(
                                artifact_id=t_comp.artifact_id,
                                name=t_comp.name,
                                artifact_type=t_comp.artifact_type,
                                old_version=b_comp.version,
                                new_version=t_comp.version,
                                change_type="retired",
                                summary=f"Thu hồi ngừng hoạt động (retired) {t_comp.name} {t_comp.version}.",
                            )
                        )
                else:
                    unchanged_count += 1

        total_changes = len(added) + len(updated) + len(deprecated) + len(retired)

        return ReleaseDiff(
            base_release_id=base.release_id,
            target_release_id=target.release_id,
            base_version=base.version,
            target_version=target.version,
            total_changes=total_changes,
            added=added,
            updated=updated,
            deprecated=deprecated,
            retired=retired,
            unchanged_count=unchanged_count,
        )

    @staticmethod
    def generate_changelog_entry(
        diff: ReleaseDiff, release_name: str, release_date: str
    ) -> ChangelogReleaseEntry:
        """Converts ReleaseDiff into a formal ChangelogReleaseEntry."""
        items: list[ChangelogItem] = []
        breaking: list[str] = []

        if diff.added:
            desc = "; ".join([d.summary for d in diff.added])
            items.append(
                ChangelogItem(
                    category="Added",
                    description=desc,
                    artifact_ids=[d.artifact_id for d in diff.added],
                )
            )

        if diff.updated:
            desc = "; ".join([d.summary for d in diff.updated])
            items.append(
                ChangelogItem(
                    category="Changed",
                    description=desc,
                    artifact_ids=[d.artifact_id for d in diff.updated],
                )
            )

        if diff.deprecated:
            desc = "; ".join([d.summary for d in diff.deprecated])
            items.append(
                ChangelogItem(
                    category="Deprecated",
                    description=desc,
                    artifact_ids=[d.artifact_id for d in diff.deprecated],
                )
            )
            breaking.extend(
                [f"Tài nguyên {d.name} chuẩn bị ngừng hỗ trợ." for d in diff.deprecated]
            )

        if diff.retired:
            desc = "; ".join([d.summary for d in diff.retired])
            items.append(
                ChangelogItem(
                    category="Removed",
                    description=desc,
                    artifact_ids=[d.artifact_id for d in diff.retired],
                )
            )
            breaking.extend(
                [
                    f"Tài nguyên {d.name} đã bị thu hồi hoàn toàn khỏi môi trường chạy."
                    for d in diff.retired
                ]
            )

        return ChangelogReleaseEntry(
            version=diff.target_version,
            release_date=release_date,
            release_name=release_name,
            items=items,
            breaking_changes=breaking,
        )


changelog_differ = ChangelogDiffer()
