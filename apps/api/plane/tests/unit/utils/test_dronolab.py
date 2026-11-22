# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from plane.utils.dronolab import (
    auto_join_open_workspace,
    is_allowed_email,
    is_auto_join_enabled,
)


@pytest.mark.unit
class TestDronolabWorkspaceRules:
    def test_allowed_email_accepts_school_domain_and_subdomains(self):
        assert is_allowed_email("member@etsmtl.ca") is True
        assert is_allowed_email("member@ens.etsmtl.ca") is True
        assert is_allowed_email("MEMBER@ENS.ETSMTL.CA") is True

    def test_allowed_email_rejects_external_domains(self):
        assert is_allowed_email("member@gmail.com") is False
        assert is_allowed_email("member@notetsmtl.ca") is False
        assert is_allowed_email("invalid-email") is False

    def test_auto_join_disabled_by_default(self, monkeypatch):
        monkeypatch.delenv("DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE", raising=False)
        assert is_auto_join_enabled() is False

    @pytest.mark.parametrize(
        "raw,expected",
        [("0", False), ("false", False), ("", False), ("1", True), ("true", True), ("YES", True)],
    )
    def test_auto_join_env_flag_parsing(self, monkeypatch, raw, expected):
        monkeypatch.setenv("DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE", raw)
        assert is_auto_join_enabled() is expected

    def test_auto_join_open_workspace_is_noop_when_disabled(self, monkeypatch):
        monkeypatch.delenv("DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE", raising=False)
        user = SimpleNamespace(email="member@ens.etsmtl.ca", is_bot=False)

        with patch("plane.utils.dronolab.transaction.atomic") as mock_atomic:
            auto_join_open_workspace(user)
            mock_atomic.assert_not_called()
