# Dronolab: transfer a workspace's ownership to another admin of that workspace.
# Allowed for the current owner, or an instance admin (to recover a workspace whose owner left).

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Workspace, WorkspaceMember
from plane.license.models import InstanceAdmin

from .. import BaseAPIView


class WorkspaceTransferOwnershipEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        is_owner = workspace.owner_id == request.user.id
        is_instance_admin = InstanceAdmin.objects.filter(user=request.user).exists()
        if not (is_owner or is_instance_admin):
            return Response(
                {"error": "Only the workspace owner can transfer ownership."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_owner_id = request.data.get("new_owner_id")
        new_owner = (
            WorkspaceMember.objects.filter(
                workspace=workspace, member_id=new_owner_id, is_active=True, member__is_bot=False
            )
            .select_related("member")
            .first()
            if new_owner_id
            else None
        )
        if new_owner is None or new_owner.role != ROLE.ADMIN.value:
            return Response(
                {"error": "The new owner must be an admin of this workspace."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_owner.member_id == workspace.owner_id:
            return Response({"error": "They already own this workspace."}, status=status.HTTP_400_BAD_REQUEST)

        workspace.owner_id = new_owner.member_id
        workspace.save(update_fields=["owner", "updated_at"])
        return Response(
            {"owner_id": str(new_owner.member_id), "owner_email": new_owner.member.email},
            status=status.HTTP_200_OK,
        )
