# Dronolab: the club's two built-in workspaces and school-only accounts.
#
# - Only addresses on DRONOLAB_EMAIL_DOMAIN (etsmtl.ca and its sub-domains, e.g. ens.etsmtl.ca)
#   can sign up or sign in.
# - Auto-joining the open workspace is off by default (DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE=0),
#   so new accounts have no workspace access until invited by an admin. Set
#   DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE=1 to re-enable auto-join (e.g. once SMTP verification is on).
# - The admin workspace is always invitation-only.
# - Each workspace has one owner; ownership moves with the transfer-ownership endpoint.

import os

from django.db import transaction

OPEN_WORKSPACE = os.environ.get("DRONOLAB_OPEN_WORKSPACE", "dronolab")
OPEN_WORKSPACE_NAME = "Dronolab"
ADMIN_WORKSPACE = os.environ.get("DRONOLAB_ADMIN_WORKSPACE", "dronolab-admin")
ADMIN_WORKSPACE_NAME = "Dronolab Admin"
EMAIL_DOMAIN = os.environ.get("DRONOLAB_EMAIL_DOMAIN", "etsmtl.ca").lower()

ROLE_ADMIN, ROLE_MEMBER = 20, 15


def is_allowed_email(email):
    domain = str(email).rsplit("@", 1)[-1].lower()
    return domain == EMAIL_DOMAIN or domain.endswith("." + EMAIL_DOMAIN)


def is_auto_join_enabled():
    return os.environ.get("DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE", "0").strip().lower() in ("1", "true", "yes")


def auto_join_open_workspace(user):
    """Add the user to the open workspace and its public projects, as a member. Idempotent."""
    if not is_auto_join_enabled():
        return

    from plane.db.models import Project, ProjectMember, Workspace, WorkspaceMember

    if user.is_bot or not is_allowed_email(user.email):
        return
    workspace = Workspace.objects.filter(slug=OPEN_WORKSPACE).first()
    if workspace is None:
        return
    with transaction.atomic():
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=user, defaults={"role": ROLE_MEMBER, "is_active": True}
        )
        for project in Project.objects.filter(workspace=workspace, network=2, archived_at__isnull=True):
            ProjectMember.objects.get_or_create(
                project=project, member=user, defaults={"role": ROLE_MEMBER, "workspace": workspace}
            )


def ensure_workspaces(owner):
    """Create (or rename) the two built-in workspaces with `owner` as their owner and admin."""
    from plane.db.models import Workspace, WorkspaceMember

    workspaces = []
    for slug, name in ((OPEN_WORKSPACE, OPEN_WORKSPACE_NAME), (ADMIN_WORKSPACE, ADMIN_WORKSPACE_NAME)):
        workspace, created = Workspace.objects.get_or_create(slug=slug, defaults={"name": name, "owner": owner})
        if not created and workspace.name != name:
            workspace.name = name
            workspace.save(update_fields=["name"])
        member, _ = WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=owner, defaults={"role": ROLE_ADMIN, "is_active": True}
        )
        if member.role != ROLE_ADMIN or not member.is_active:
            member.role, member.is_active = ROLE_ADMIN, True
            member.save(update_fields=["role", "is_active"])
        workspaces.append((workspace, created))
    return workspaces
