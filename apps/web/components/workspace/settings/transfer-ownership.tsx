/**
 * Dronolab: Transfer workspace ownership section for workspace General settings
 * (backend: apps/api/plane/app/views/workspace/ownership.py).
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { API_BASE_URL } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import type { IUser, IUserLite, IWorkspace, IWorkspaceMember } from "@plane/types";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// services
import { APIService } from "@/services/api.service";

type TTransferOwnershipResponse = {
  owner_id: string;
  owner_email: string;
};

// Dronolab: API service for workspace ownership transfer
class WorkspaceOwnershipService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async transferOwnership(workspaceSlug: string, newOwnerId: string): Promise<TTransferOwnershipResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/transfer-ownership/`, {
      new_owner_id: newOwnerId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const workspaceOwnershipService = new WorkspaceOwnershipService();

type TTransferOwnershipProps = {
  workspace?: IWorkspace | null;
};

const getUserDisplayName = (user: Pick<IUserLite, "display_name" | "first_name" | "last_name" | "email">): string => {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return user.display_name?.trim() || fullName || user.email || "";
};

const formatUserLabel = (user: Pick<IUserLite, "display_name" | "first_name" | "last_name" | "email">): string => {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const name = user.display_name?.trim() || fullName;
  if (name && user.email) return `${name} (${user.email})`;
  return name || user.email || "";
};

// Dronolab: section allowing the workspace owner to transfer ownership to another active admin
export const WorkspaceTransferOwnership = observer(function WorkspaceTransferOwnership(props: TTransferOwnershipProps) {
  // states
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // store hooks
  const { data: currentUser } = useUser();
  const { currentWorkspace, fetchWorkspaces } = useWorkspace();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails, fetchWorkspaceMembers },
  } = useMember();

  const activeWorkspace = props.workspace ?? currentWorkspace;

  // Dronolab: keep workspace member roles fresh when opening General settings
  const { isLoading: isMembersLoading } = useSWR(
    activeWorkspace?.slug ? `WORKSPACE_TRANSFER_OWNERSHIP_MEMBERS_${activeWorkspace.slug}` : null,
    activeWorkspace?.slug ? () => fetchWorkspaceMembers(activeWorkspace.slug) : null
  );

  if (!activeWorkspace) return null;

  // Dronolab: WorkSpaceSerializer returns `owner` as a UUID string at runtime even though
  // IWorkspace types it as IUser, so support both shapes and resolve user details via the member store.
  const rawOwner: IUser | string | null | undefined = activeWorkspace.owner;
  const ownerId = typeof rawOwner === "string" ? rawOwner : rawOwner?.id;
  const ownerFromObject = typeof rawOwner === "object" && rawOwner !== null ? rawOwner : undefined;
  const ownerFromStore = ownerId ? getUserDetails(ownerId) : undefined;
  const ownerUser =
    ownerFromObject ?? ownerFromStore ?? (ownerId && ownerId === currentUser?.id ? currentUser : undefined);

  const ownerLabel = ownerUser ? formatUserLabel(ownerUser) : ownerId || "Unknown";
  const isOwner = Boolean(currentUser?.id && ownerId && currentUser.id === ownerId);

  const eligibleAdmins: IWorkspaceMember[] = (workspaceMemberIds ?? [])
    .map((memberId) => getWorkspaceMemberDetails(memberId))
    .filter(
      (details): details is IWorkspaceMember =>
        details !== null &&
        Boolean(details.member) &&
        details.is_active !== false &&
        !details.member.is_bot &&
        details.role === EUserWorkspaceRoles.ADMIN &&
        details.member.id !== ownerId
    );

  const selectedAdmin = eligibleAdmins.find((admin) => admin.member.id === selectedOwnerId);

  const handleTransferOwnership = async () => {
    if (!selectedAdmin || isSubmitting) return;

    const targetName = getUserDisplayName(selectedAdmin.member) || "this member";
    const confirmed = window.confirm(
      `Transfer ownership of this workspace to ${targetName}? You will remain an admin.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const response = await workspaceOwnershipService.transferOwnership(
        activeWorkspace.slug,
        selectedAdmin.member.id
      );
      const targetEmail = response?.owner_email || selectedAdmin.member.email || targetName;
      setSelectedOwnerId("");
      setToast({
        type: "success",
        title: "Success!",
        message: `Ownership transferred to ${targetEmail}`,
      });
      try {
        await fetchWorkspaces();
      } catch (refreshError) {
        console.error("Failed to refresh workspaces after ownership transfer:", refreshError);
      }
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" &&
        err !== null &&
        "error" in err &&
        typeof (err as { error?: unknown }).error === "string"
          ? (err as { error: string }).error
          : "Failed to transfer workspace ownership. Please try again.";
      setToast({
        type: "error",
        title: "Error!",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  let control: ReactNode;
  if (!isOwner) {
    control = <span className="text-body-xs-regular text-tertiary">Only the owner can transfer ownership.</span>;
  } else if (isMembersLoading && (!workspaceMemberIds || workspaceMemberIds.length === 0)) {
    control = <span className="text-body-xs-regular text-tertiary">Loading members...</span>;
  } else if (eligibleAdmins.length === 0) {
    control = <span className="text-body-xs-regular text-tertiary">Promote another member to Admin first.</span>;
  } else {
    control = (
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="New workspace owner"
          value={selectedOwnerId}
          disabled={isSubmitting}
          onChange={(e) => setSelectedOwnerId(e.target.value)}
          className="h-8 min-w-52 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary outline-none hover:bg-layer-transparent-hover focus:border-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="" className="bg-surface-1 text-primary">
            Select an admin...
          </option>
          {eligibleAdmins.map((admin) => (
            <option key={admin.member.id} value={admin.member.id} className="bg-surface-1 text-primary">
              {formatUserLabel(admin.member)}
            </option>
          ))}
        </select>
        <Button
          variant="danger-outline"
          size="sm"
          stretch="auto"
          label={isSubmitting ? "Transferring..." : "Transfer ownership"}
          disabled={!selectedAdmin || isSubmitting}
          loading={isSubmitting}
          onClick={() => {
            void handleTransferOwnership();
          }}
        />
      </div>
    );
  }

  return (
    <SettingsBoxedControlItem
      title="Transfer ownership"
      description={
        <>
          Transfer ownership of this workspace to another admin. Current owner:{" "}
          <span className="font-medium text-primary">{ownerLabel}</span>.
        </>
      }
      control={control}
    />
  );
});
