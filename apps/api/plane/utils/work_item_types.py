# Dronolab: Epic / Story / Task work item types for the community edition.
# Built on upstream's issue_types and project_issue_types tables.

from django.db.models import Q

from plane.db.models import IssueType
from plane.db.models.issue_type import ProjectIssueType

EPIC, STORY, TASK = "Epic", "Story", "Task"

# name: (is_epic, level, is_default)
TYPE_SPECS = {
    EPIC: (True, 0, False),
    STORY: (False, 1, False),
    TASK: (False, 2, True),
}

# Which types may sit under a parent of each type.
ALLOWED_CHILDREN = {
    EPIC: {STORY, TASK},
    STORY: {TASK},
    TASK: {TASK},
}


def ensure_work_item_types(project):
    """Create the workspace's Epic/Story/Task types and link them to the project. Idempotent."""
    types = {}
    for name, (is_epic, level, is_default) in TYPE_SPECS.items():
        issue_type, _ = IssueType.objects.get_or_create(
            workspace_id=project.workspace_id,
            name=name,
            is_epic=is_epic,
            defaults={"level": level, "is_default": is_default},
        )
        ProjectIssueType.objects.get_or_create(
            project=project,
            issue_type=issue_type,
            defaults={"level": level, "is_default": is_default},
        )
        types[name] = issue_type
    return types


def epic_q(prefix=""):
    """Work items that are epics."""
    return Q(**{f"{prefix}type__is_epic": True})


def non_epic_q(prefix=""):
    """Work items that are not epics (untyped ones included)."""
    return Q(**{f"{prefix}type__isnull": True}) | Q(**{f"{prefix}type__is_epic": False})


def nesting_error(child_type, parent):
    """Return an error message if `child_type` may not sit under `parent`, else None."""
    if parent is None:
        return None
    child_name = child_type.name if child_type else TASK
    if child_type is not None and child_type.is_epic:
        return "An epic cannot have a parent."
    parent_name = parent.type.name if parent.type else TASK
    if child_name not in ALLOWED_CHILDREN.get(parent_name, {TASK}):
        return f"A {child_name.lower()} cannot be placed under a {parent_name.lower()}."
    return None
