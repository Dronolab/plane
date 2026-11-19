# Dronolab: Epics for the community edition.
# The work item views, limited to epics (see scope_epics in base.py); creating sets the Epic type.

from django.db.models import Count
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Issue, Project
from plane.utils.work_item_types import EPIC, STORY, ensure_work_item_types

from .. import BaseAPIView
from .base import IssueDetailEndpoint, IssuePaginatedViewSet, IssueViewSet


class EpicViewSet(IssueViewSet):
    epics = True

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        if request.data.get("parent_id") or request.data.get("parent"):
            return Response({"error": "An epic cannot have a parent."}, status=status.HTTP_400_BAD_REQUEST)
        epic_type = ensure_work_item_types(project)[EPIC]
        if hasattr(request.data, "_mutable"):
            request.data._mutable = True
        request.data["type"] = str(epic_type.id)
        return super().create(request, slug, project_id)


class EpicPaginatedViewSet(IssuePaginatedViewSet):
    epics = True


class EpicDetailEndpoint(IssueDetailEndpoint):
    epics = True


class EpicProgressEndpoint(BaseAPIView):
    """Counts of everything under an epic (stories, tasks, subtasks) by state group."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, epic_id):
        epic = Issue.issue_objects.filter(
            workspace__slug=slug, project_id=project_id, pk=epic_id, type__is_epic=True
        ).first()
        if epic is None:
            return Response({"error": "Epic not found."}, status=status.HTTP_404_NOT_FOUND)

        descendant_ids, frontier = set(), [epic.id]
        while frontier:
            children = set(Issue.issue_objects.filter(parent_id__in=frontier).values_list("id", flat=True))
            frontier = list(children - descendant_ids)
            descendant_ids |= children

        by_group = {
            row["state__group"]: row["count"]
            for row in Issue.issue_objects.filter(id__in=descendant_ids)
            .values("state__group")
            .annotate(count=Count("id"))
        }
        total = sum(by_group.values())
        completed = by_group.get("completed", 0)
        cancelled = by_group.get("cancelled", 0)
        counted = total - cancelled
        return Response(
            {
                "total": total,
                "backlog": by_group.get("backlog", 0),
                "unstarted": by_group.get("unstarted", 0),
                "started": by_group.get("started", 0),
                "completed": completed,
                "cancelled": cancelled,
                "progress": round(100 * completed / counted) if counted else 0,
                "stories": Issue.issue_objects.filter(parent=epic, type__name=STORY).count(),
            },
            status=status.HTTP_200_OK,
        )
