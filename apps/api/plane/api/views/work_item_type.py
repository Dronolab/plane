# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Dronolab: the project's work item types (Epic, Story, Task) for API key clients.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Project
from plane.utils.work_item_types import ensure_work_item_types
from .base import BaseAPIView


class WorkItemTypeListAPIEndpoint(BaseAPIView):
    """List the project's work item types, linking Epic, Story and Task to it on first use."""

    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id):
        project = Project.objects.filter(pk=project_id, workspace__slug=slug, archived_at__isnull=True).first()
        if project is None:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        types = ensure_work_item_types(project)
        return Response(
            [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "is_epic": t.is_epic,
                    "level": t.level,
                    "is_default": t.is_default,
                }
                for t in types.values()
            ],
            status=status.HTTP_200_OK,
        )
