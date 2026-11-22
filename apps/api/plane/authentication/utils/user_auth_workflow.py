# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.utils.dronolab import auto_join_open_workspace

from .workspace_project_join import process_workspace_project_invitations


def post_user_auth_workflow(user, is_signup, request):
    process_workspace_project_invitations(user=user)
    # Dronolab: auto-join the open club workspace only when DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE=1
    auto_join_open_workspace(user)
