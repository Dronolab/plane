# Dronolab: create the club's two built-in workspaces and lock workspace creation.
#
#   python manage.py dronolab_setup --owner someone@ens.etsmtl.ca
#
# Idempotent: re-running renames the workspaces back, re-adds the owner as admin and
# re-locks workspace creation. When DRONOLAB_AUTO_JOIN_OPEN_WORKSPACE=1, existing
# members already in the database also join the open workspace.

from django.core.management.base import BaseCommand, CommandError

from plane.db.models import User
from plane.license.models import InstanceConfiguration
from plane.utils.dronolab import (
    auto_join_open_workspace,
    ensure_workspaces,
    is_allowed_email,
    is_auto_join_enabled,
)


class Command(BaseCommand):
    help = "Create the Dronolab and Dronolab Admin workspaces and disable workspace creation"

    def add_arguments(self, parser):
        parser.add_argument("--owner", required=True, help="Email of the owner of both workspaces")

    def handle(self, *args, **options):
        email = options["owner"].strip().lower()
        if not is_allowed_email(email):
            raise CommandError(f"{email} is not a school address")
        owner = User.objects.filter(email=email, is_bot=False).first()
        if owner is None:
            raise CommandError(f"No account for {email}; sign up first")

        for workspace, created in ensure_workspaces(owner):
            action = "created" if created else "kept"
            self.stdout.write(f"{action} {workspace.slug} ({workspace.name}), owner {workspace.owner.email}")

        InstanceConfiguration.objects.update_or_create(
            key="DISABLE_WORKSPACE_CREATION",
            defaults={"value": "1", "category": "WORKSPACE_MANAGEMENT", "is_encrypted": False},
        )
        self.stdout.write("workspace creation disabled")

        if is_auto_join_enabled():
            for user in User.objects.filter(is_bot=False, is_active=True):
                auto_join_open_workspace(user)
            self.stdout.write("existing school accounts joined the open workspace")
        else:
            self.stdout.write("auto-join disabled; existing accounts were not added to the open workspace")
