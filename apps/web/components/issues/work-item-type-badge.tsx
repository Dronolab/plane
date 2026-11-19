/**
 * Dronolab: a small coloured pill showing a work item's type (Epic, Story, Task, Sous-tâche).
 * The project's types come from GET /work-item-types/ (cached once per project by SWR).
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

type TWorkItemType = { id: string; name: string; is_epic: boolean; level: number; is_default: boolean };

class WorkItemTypeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string): Promise<TWorkItemType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-types/`)
      .then((response) => response?.data ?? [])
      .catch(() => []);
  }
}

const workItemTypeService = new WorkItemTypeService();

export function useWorkItemTypes(workspaceSlug: string | undefined, projectId: string | undefined) {
  const { data } = useSWR(
    workspaceSlug && projectId ? `DRONOLAB_WORK_ITEM_TYPES_${projectId}` : null,
    () => workItemTypeService.list(workspaceSlug!, projectId!),
    { revalidateOnFocus: false, revalidateIfStale: false }
  );
  return data;
}

const STYLES: Record<string, { label: string; className: string }> = {
  Epic: { label: "Epic", className: "bg-[#8b5cf6]/15 text-[#a78bfa]" },
  Story: { label: "Story", className: "bg-[#3b82f6]/15 text-[#60a5fa]" },
  Task: { label: "Task", className: "bg-[#10b981]/15 text-[#34d399]" },
  Subtask: { label: "Subtask", className: "bg-[#64748b]/15 text-[#94a3b8]" },
};

type Props = {
  projectId: string;
  typeId: string | null | undefined;
  /** The parent's type id: a Task under a Task is shown as a subtask. */
  parentTypeId?: string | null;
};

export const WorkItemTypeBadge = observer(function WorkItemTypeBadge({ projectId, typeId, parentTypeId }: Props) {
  const { workspaceSlug } = useParams();
  const types = useWorkItemTypes(workspaceSlug?.toString(), projectId);
  const type = types?.find((t) => t.id === typeId);
  if (!type) return null;
  const parentType = types?.find((t) => t.id === parentTypeId);
  const key = type.name === "Task" && parentType?.name === "Task" ? "Subtask" : type.name;
  const style = STYLES[key];
  if (!style) return null;
  return (
    <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-caption-sm-medium leading-none ${style.className}`}>
      {style.label}
    </span>
  );
});
