"""Release manifests and release diff routes."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from src.schemas.common import SuccessEnvelope
from src.schemas.manifest import ReleaseDiff, ReleaseManifest
from src.services.changelog_differ import changelog_differ
from src.services.manifest_builder import manifest_builder

router = APIRouter(prefix="/releases", tags=["Release Management"])


class CreateManifestRequest(BaseModel):
    version: str
    release_name: str
    description: str
    release_notes: str
    git_tag: str
    include_drafts: bool = False


@router.get("/manifests", response_model=SuccessEnvelope[list[ReleaseManifest]])
def list_manifests():
    """Lists all published release manifests."""
    manifests = manifest_builder.list_manifests()
    return SuccessEnvelope(data=manifests, meta={"total_releases": len(manifests)})


@router.get("/manifests/{release_id}", response_model=SuccessEnvelope[ReleaseManifest])
def get_manifest(release_id: str):
    """Retrieves a single release manifest by ID or version."""
    try:
        manifest = manifest_builder.get_manifest(release_id)
        return SuccessEnvelope(data=manifest)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Không tìm thấy bản phát hành '{release_id}'."
        )


@router.post(
    "/manifests", response_model=SuccessEnvelope[ReleaseManifest], status_code=201
)
def create_manifest(req: CreateManifestRequest):
    """Packages and publishes an immutable release manifest."""
    manifest = manifest_builder.build_manifest(
        version=req.version,
        release_name=req.release_name,
        description=req.description,
        release_notes=req.release_notes,
        git_tag=req.git_tag,
        include_drafts=req.include_drafts,
    )
    return SuccessEnvelope(data=manifest)


@router.get("/diff", response_model=SuccessEnvelope[ReleaseDiff])
def compare_releases(
    base: str = Query(..., description="Base release id or version"),
    target: str = Query(..., description="Target release id or version"),
):
    """Compares two release manifests and returns component diff."""
    try:
        base_m = manifest_builder.get_manifest(base)
        target_m = manifest_builder.get_manifest(target)
        diff = changelog_differ.compare_releases(base_m, target_m)
        return SuccessEnvelope(data=diff)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
