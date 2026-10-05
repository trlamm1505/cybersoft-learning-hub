"""Tests for Release Manifest diffing and changelog generation."""

from src.services.changelog_differ import changelog_differ
from src.services.manifest_builder import ManifestBuilder


def test_diff_added_components(builder: ManifestBuilder):
    m_base = builder.get_manifest("v1.0.0")
    m_target = builder.get_manifest("v1.1.0")
    diff = changelog_differ.compare_releases(m_base, m_target)

    assert diff.total_changes == 5
    assert len(diff.added) == 3
    added_ids = [a.artifact_id for a in diff.added]
    assert "dataset_ai_knowledge_chunks_corpus_multi_hop_v1.1.0" in added_ids
    assert "index_hybrid_rag_search_index_v1.1.0" in added_ids
    assert "prompt_exercise_generator_system_prompt_enhanced_v1.1.0" in added_ids


def test_diff_deprecated_components(builder: ManifestBuilder):
    m_base = builder.get_manifest("v1.0.0")
    m_target = builder.get_manifest("v1.1.0")
    diff = changelog_differ.compare_releases(m_base, m_target)

    assert len(diff.deprecated) == 2
    deprecated_ids = [d.artifact_id for d in diff.deprecated]
    assert "dataset_ai_knowledge_chunks_corpus_v1.0.0" in deprecated_ids
    assert "prompt_exercise_generator_system_prompt_v1.0.0" in deprecated_ids


def test_changelog_entry_generation(builder: ManifestBuilder):
    m_base = builder.get_manifest("v1.0.0")
    m_target = builder.get_manifest("v1.1.0")
    diff = changelog_differ.compare_releases(m_base, m_target)
    entry = changelog_differ.generate_changelog_entry(
        diff, m_target.release_name, m_target.release_date
    )

    assert entry.version == "v1.1.0"
    categories = [i.category for i in entry.items]
    assert "Added" in categories
    assert "Deprecated" in categories
    assert len(entry.breaking_changes) == 2
