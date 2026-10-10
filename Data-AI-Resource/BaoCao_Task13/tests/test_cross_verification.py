"""Verify 3-way cross-verification engine consistency."""

import os
import sys


def test_cross_verification_engine_runs_successfully(base_dir):
    scripts_dir = os.path.join(base_dir, "scripts")
    sys.path.insert(0, scripts_dir)
    from cross_verification_engine import run_cross_verification

    success = run_cross_verification()
    assert (
        success is True
    ), "3-Way Cross Verification Engine failed or found non-zero delta"
