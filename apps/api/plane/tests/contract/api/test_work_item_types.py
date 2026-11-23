# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Dronolab: work item types (Epic, Story, Task) through the API key API."""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueType, Project, ProjectMember, Workspace
from plane.utils.work_item_types import ensure_work_item_types


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Types", identifier="TY", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture(autouse=True)
def _no_activity():
    with (
        mock.patch("plane.api.views.issue.issue_activity"),
        mock.patch("plane.api.views.issue.model_activity"),
    ):
        yield


def types_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-item-types/"


def items_url(workspace, project, item_id=None):
    base = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/"
    return f"{base}{item_id}/" if item_id else base


def make_item(project, name, issue_type=None, parent=None):
    issue = Issue(name=name, workspace=project.workspace, project=project, type=issue_type, parent=parent)
    issue.save()
    return issue


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemTypeList:
    def test_lists_and_links_the_three_types(self, api_key_client, workspace, project):
        response = api_key_client.get(types_url(workspace, project))

        assert response.status_code == status.HTTP_200_OK
        by_name = {t["name"]: t for t in response.data}
        assert set(by_name) == {"Epic", "Story", "Task"}
        assert by_name["Epic"]["is_epic"] is True
        assert by_name["Task"]["is_default"] is True
        assert project.project_issue_types.count() == 3

    def test_is_idempotent(self, api_key_client, workspace, project):
        first = api_key_client.get(types_url(workspace, project)).data
        second = api_key_client.get(types_url(workspace, project)).data

        assert sorted(t["id"] for t in first) == sorted(t["id"] for t in second)
        assert IssueType.objects.filter(workspace=workspace).count() == 3

    def test_non_member_is_refused(self, api_key_client, workspace, create_user):
        other = Project.objects.create(name="Other", identifier="OT", workspace=workspace, created_by=create_user)

        response = api_key_client.get(types_url(workspace, other))

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemTypeValidation:
    def test_create_epic_and_story_under_it(self, api_key_client, workspace, project):
        types = ensure_work_item_types(project)

        epic = api_key_client.post(
            items_url(workspace, project), {"name": "E", "type_id": str(types["Epic"].id)}, format="json"
        )
        story = api_key_client.post(
            items_url(workspace, project),
            {"name": "S", "type_id": str(types["Story"].id), "parent": epic.data["id"]},
            format="json",
        )

        assert epic.status_code == status.HTTP_201_CREATED, epic.data
        assert story.status_code == status.HTTP_201_CREATED, story.data
        assert Issue.objects.get(pk=story.data["id"]).type == types["Story"]

    def test_epic_cannot_have_a_parent(self, api_key_client, workspace, project):
        types = ensure_work_item_types(project)
        parent = make_item(project, "Parent", types["Task"])

        response = api_key_client.post(
            items_url(workspace, project),
            {"name": "E", "type_id": str(types["Epic"].id), "parent": str(parent.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "parent_id" in response.data

    def test_story_cannot_go_under_a_task(self, api_key_client, workspace, project):
        types = ensure_work_item_types(project)
        task = make_item(project, "T", types["Task"])
        story = make_item(project, "S", types["Story"])

        response = api_key_client.patch(
            items_url(workspace, project, story.id), {"parent": str(task.id)}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "parent_id" in response.data

    def test_type_and_parent_change_together(self, api_key_client, workspace, project):
        types = ensure_work_item_types(project)
        epic = make_item(project, "E", types["Epic"])
        item = make_item(project, "I", types["Task"])
        make_item(project, "Child", types["Task"], parent=item)

        response = api_key_client.patch(
            items_url(workspace, project, item.id),
            {"type_id": str(types["Story"].id), "parent": str(epic.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        item.refresh_from_db()
        assert (item.type, item.parent_id) == (types["Story"], epic.id)

    def test_type_change_must_fit_children(self, api_key_client, workspace, project):
        types = ensure_work_item_types(project)
        item = make_item(project, "I", types["Task"])
        make_item(project, "Child story", types["Story"], parent=item)

        response = api_key_client.patch(
            items_url(workspace, project, item.id), {"type_id": str(types["Task"].id)}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK  # unchanged type: not re-checked

        response = api_key_client.patch(
            items_url(workspace, project, item.id), {"type_id": str(types["Story"].id)}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "type_id" in response.data

    def test_type_from_another_workspace_is_refused(self, api_key_client, workspace, project, create_user):
        other_ws = Workspace.objects.create(name="Other", owner=create_user, slug="other-ws")
        other_project = Project.objects.create(name="O", identifier="O", workspace=other_ws, created_by=create_user)
        foreign_epic = ensure_work_item_types(other_project)["Epic"]
        ensure_work_item_types(project)

        response = api_key_client.post(
            items_url(workspace, project), {"name": "X", "type_id": str(foreign_epic.id)}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "type_id" in response.data
