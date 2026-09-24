"""Filter Engine for Resource Quality Dashboard.

Provides multi-dimensional slicing and querying without coupling to UI components.
"""

from typing import List, Optional
from src.collector import ResourceItem


class FilterEngine:
    """Filters ResourceItem lists by multiple dimensions."""

    @staticmethod
    def filter_resources(
        resources: List[ResourceItem],
        track: Optional[str] = "All",
        domain: Optional[str] = "All",
        difficulty_level: Optional[str] = "All",
        quality_tier: Optional[str] = "All",
        resource_type: Optional[str] = "All",
        search_query: Optional[str] = None,
        min_rqi: float = 0.0,
    ) -> List[ResourceItem]:
        results = []

        q = (search_query or "").strip().lower()

        for r in resources:
            # 1. Track filter
            if track and track != "All" and r.track != track:
                continue

            # 2. Domain filter
            if domain and domain != "All" and r.domain != domain:
                continue

            # 3. Difficulty Level filter
            if (
                difficulty_level
                and difficulty_level != "All"
                and r.difficulty_level != difficulty_level
            ):
                continue

            # 4. Quality Tier filter
            if (
                quality_tier
                and quality_tier != "All"
                and r.quality_tier != quality_tier
            ):
                continue

            # 5. Resource Type filter
            if (
                resource_type
                and resource_type != "All"
                and r.resource_type != resource_type
            ):
                continue

            # 6. Min RQI
            if r.rqi < min_rqi:
                continue

            # 7. Text Search
            if q:
                match = (
                    q in r.id.lower()
                    or q in r.name.lower()
                    or q in r.domain.lower()
                    or q in r.description.lower()
                    or any(q in s.lower() for s in r.skills)
                )
                if not match:
                    continue

            results.append(r)

        return results
