"""Unit tests for Usability Metrics and SUS calculations."""

import pytest
from src.services.usability_engine import UsabilityEngine


def test_sus_calculation_brookes_1996(usability_engine):
    perfect = [5, 1, 5, 1, 5, 1, 5, 1, 5, 1]
    assert usability_engine.calculate_sus(perfect) == 100.0

    lowest = [1, 5, 1, 5, 1, 5, 1, 5, 1, 5]
    assert usability_engine.calculate_sus(lowest) == 0.0


def test_sus_grading_mapping(usability_engine):
    assert usability_engine.grade_sus(95.0) == ("A+", "Best Imaginable")
    assert usability_engine.grade_sus(85.0) == ("A", "Excellent")
    assert usability_engine.grade_sus(72.0) == ("B", "Good")
    assert usability_engine.grade_sus(55.0) == ("C", "OK")
    assert usability_engine.grade_sus(40.0) == ("F", "Poor")


def test_sample_size_exactly_five(usability_engine):
    summary = usability_engine.get_summary()
    assert summary.total_users == 5
    assert summary.total_tasks == 25
    assert len(summary.user_evaluations) == 5


def test_time_to_find_reduction_percentage(usability_engine):
    summary = usability_engine.get_summary()
    assert summary.avg_initial_time_to_find_sec > summary.avg_final_time_to_find_sec
    assert summary.time_reduction_percentage >= 50.0
    assert summary.avg_final_time_to_find_sec < 25.0


def test_task_success_rate_initial_vs_final(usability_engine):
    summary = usability_engine.get_summary()
    assert summary.initial_task_success_rate >= 90.0
    assert summary.final_task_success_rate == 100.0


def test_csat_average_calculation(usability_engine):
    summary = usability_engine.get_summary()
    assert summary.avg_csat_rating >= 4.5
    assert summary.avg_csat_rating <= 5.0
