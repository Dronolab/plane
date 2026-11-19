/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import {
  CompletedAtOutline,
  CreatedAtOutline,
  CyclesOutline,
  EstimateOutline,
  LabelsOutline,
  ModuleOutline,
  ParentOutline,
  UpdatedAtOutline,
  UserOutline,
  // Dronolab: icon for Type property row
  WorkItemsOutline,
} from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { calculateTimeAgo, cn, renderFormattedDate } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { EstimateSelect } from "@/components/dropdowns/estimate/estimate-select";
import { IssueParentSelectRoot } from "@/components/issues/parent-select-root";
// Dronolab: work item type badge and types hook
import { WorkItemTypeBadge, useWorkItemTypes } from "@/components/issues/work-item-type-badge";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// local imports
import { IssueCycleSelect } from "./cycle-select";
import { IssueLabel } from "./label";
import { IssueModuleSelect } from "./module-select";
import type { TIssueOperations } from "./root";
import { IssueDetailSidebarGroup } from "./sidebar-group";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  /** Show "Updated <time ago>" beside the Properties title (detail page). */
  showUpdatedMeta?: boolean;
};

const AUDIT_DATE_FORMAT = "MMM d, yyyy h:mma";

const formatAuditDate = (date: string | null | undefined) =>
  date ? renderFormattedDate(new Date(date), AUDIT_DATE_FORMAT) : undefined;

/**
 * Work item properties shared by the detail page sidebar and the peek overview: grouped into
 * collapsible "Details" and "Project structure" sections, followed by created/updated metadata.
 */
export const IssueDetailSidebarSections = observer(function IssueDetailSidebarSections(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled, showUpdatedMeta = false } = props;
  // hooks
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  // Dronolab: fetch project work item types for the Type property row
  const workItemTypes = useWorkItemTypes(workspaceSlug, projectId);
  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return null;

  // Dronolab: determine if this work item is an Epic and list selectable non-epic types
  const currentWorkItemType = workItemTypes?.find((type) => type.id === issue.type_id);
  const isEpicType = !!currentWorkItemType?.is_epic;
  const selectableWorkItemTypes = (workItemTypes ?? [])
    .filter((type) => !type.is_epic)
    .sort((a, b) => a.level - b.level);

  const projectDetails = getProjectById(issue.project_id);
  const createdByDetails = getUserDetails(issue.created_by);
  const createdByName = createdByDetails?.display_name?.includes("-intake") ? "Plane" : createdByDetails?.display_name;
  const hasProjectStructureProperties = !!projectDetails?.cycle_view || !!projectDetails?.module_view;

  const auditRows = [
    createdByName ? { key: "created_by", icon: UserOutline, text: `${t("common.created_by")} ${createdByName}` } : null,
    formatAuditDate(issue.created_at)
      ? {
          key: "created_on",
          icon: CreatedAtOutline,
          text: `${t("common.created_on")} ${formatAuditDate(issue.created_at)}`,
        }
      : null,
    formatAuditDate(issue.updated_at)
      ? {
          key: "updated_on",
          icon: UpdatedAtOutline,
          text: `${t("common.updated_on")} ${formatAuditDate(issue.updated_at)}`,
        }
      : null,
    formatAuditDate(issue.completed_at)
      ? {
          key: "completed_on",
          icon: CompletedAtOutline,
          text: `${t("common.completed_on")} ${formatAuditDate(issue.completed_at)}`,
        }
      : null,
  ].filter((row) => row !== null);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex w-full items-center justify-between gap-2">
        <h5 className="text-body-sm-semibold text-primary">{t("common.properties")}</h5>
        {showUpdatedMeta && issue.updated_at && (
          <span className="truncate text-caption-sm-regular text-tertiary">
            {t("issue.updated_time_ago", { time: calculateTimeAgo(issue.updated_at) })}
          </span>
        )}
      </div>

      <div className={cn("flex flex-col gap-5", { "opacity-60": disabled })}>
        <IssueDetailSidebarGroup label={t("common.details")}>
          {/* Dronolab: Type property row (Epic read-only badge; Story/Task selectable) */}
          <SidebarPropertyListItem icon={WorkItemsOutline} label="Type">
            {isEpicType ? (
              <div className="flex h-8 items-center px-2">
                <WorkItemTypeBadge projectId={projectId} typeId={issue.type_id} />
              </div>
            ) : (
              <select
                aria-label="Type"
                value={issue.type_id ?? ""}
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.value) {
                    issueOperations.update(workspaceSlug, projectId, issueId, { type_id: e.target.value });
                  }
                }}
                className="h-8 w-full rounded-sm border border-subtle bg-transparent px-2 text-body-xs-regular text-primary outline-none hover:bg-layer-transparent-hover focus:border-accent-strong disabled:cursor-not-allowed"
              >
                {issue.type_id == null && (
                  <option value="" className="bg-surface-1 text-primary">
                    —
                  </option>
                )}
                {selectableWorkItemTypes.map((type) => (
                  <option key={type.id} value={type.id} className="bg-surface-1 text-primary">
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          </SidebarPropertyListItem>

          <SidebarPropertyListItem icon={ParentOutline} label={t("common.parent")}>
            <IssueParentSelectRoot
              className="w-full grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </SidebarPropertyListItem>

          <SidebarPropertyListItem icon={LabelsOutline} label={t("common.labels")}>
            <IssueLabel workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
          </SidebarPropertyListItem>

          {projectId && areEstimateEnabledByProjectId(projectId) && (
            <SidebarPropertyListItem icon={EstimateOutline} label={t("common.estimate")}>
              <EstimateSelect
                value={issue.estimate_point ?? undefined}
                onChange={(val: string | null) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })
                }
                projectId={projectId}
                disabled={disabled}
                variant="select-ghost-md"
                className="h-8"
                placeholder={t("common.none")}
                tooltip
              />
            </SidebarPropertyListItem>
          )}
        </IssueDetailSidebarGroup>

        {hasProjectStructureProperties && (
          <>
            <div className="w-full border-t border-subtle" />

            <IssueDetailSidebarGroup label={t("common.project_structure")}>
              {projectDetails?.cycle_view && (
                <SidebarPropertyListItem icon={CyclesOutline} label={t("common.cycle")}>
                  <IssueCycleSelect
                    className="h-8 w-full grow"
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    issueOperations={issueOperations}
                    disabled={disabled}
                  />
                </SidebarPropertyListItem>
              )}

              {projectDetails?.module_view && (
                <SidebarPropertyListItem icon={ModuleOutline} label={t("common.modules")}>
                  <IssueModuleSelect
                    className="w-full grow"
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    issueOperations={issueOperations}
                    disabled={disabled}
                  />
                </SidebarPropertyListItem>
              )}
            </IssueDetailSidebarGroup>
          </>
        )}
      </div>

      {auditRows.length > 0 && (
        <div className={cn("flex flex-col gap-1 py-6", { "opacity-60": disabled })}>
          {auditRows.map((row) => (
            <div key={row.key} className="flex items-center gap-2 rounded-sm py-1">
              <row.icon className="size-3.5 shrink-0 text-placeholder" />
              <span className="text-caption-md-regular text-placeholder">{row.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
