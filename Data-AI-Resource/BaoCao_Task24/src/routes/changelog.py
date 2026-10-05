"""Changelog query endpoint."""

from fastapi import APIRouter
from src.schemas.common import SuccessEnvelope
from src.schemas.manifest import ChangelogReleaseEntry
from src.services.changelog_differ import changelog_differ
from src.services.manifest_builder import manifest_builder

router = APIRouter(prefix="/releases", tags=["Changelog"])


@router.get("/changelog", response_model=SuccessEnvelope[list[ChangelogReleaseEntry]])
def get_changelog():
    """Generates and returns the official changelog across all releases."""
    manifests = manifest_builder.list_manifests()
    entries: list[ChangelogReleaseEntry] = []

    if not manifests:
        return SuccessEnvelope(data=[])

    # First release (baseline)
    first = manifests[0]
    entries.append(
        ChangelogReleaseEntry(
            version=first.version,
            release_date=first.release_date,
            release_name=first.release_name,
            items=[],
            breaking_changes=[],
        )
    )

    # Subsequent releases: compute diff with previous
    for i in range(1, len(manifests)):
        prev = manifests[i - 1]
        curr = manifests[i]
        diff = changelog_differ.compare_releases(prev, curr)
        entry = changelog_differ.generate_changelog_entry(
            diff, curr.release_name, curr.release_date
        )
        entries.append(entry)

    # Reverse to show newest first
    return SuccessEnvelope(data=list(reversed(entries)))
