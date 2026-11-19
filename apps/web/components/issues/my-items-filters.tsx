/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Dronolab: quick-filter toggle buttons ("Assigned to me", "Created by me") for project work items.

import { useCallback, useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import type { TWorkItemFilterConditionData, TWorkItemFilterExpression } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUser } from "@/hooks/store/user";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";

type TMyItemsQuickFiltersProps = {
  workspaceSlug: string;
  projectId: string;
};

function toConditions(expr: TWorkItemFilterExpression | undefined): TWorkItemFilterConditionData[] {
  if (!expr || typeof expr !== "object") return [];
  if (Object.keys(expr).length === 0) return [];
  if ("and" in expr && Array.isArray(expr.and)) {
    return [...expr.and];
  }
  return [expr as TWorkItemFilterConditionData];
}

function fromConditions(conditions: TWorkItemFilterConditionData[]): TWorkItemFilterExpression {
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { and: conditions };
}

function isConditionEqual(a: TWorkItemFilterConditionData, b: TWorkItemFilterConditionData): boolean {
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const aKeys = Object.keys(a) as (keyof TWorkItemFilterConditionData)[];
  const bKeys = Object.keys(b) as (keyof TWorkItemFilterConditionData)[];
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]);
}

export const MyItemsQuickFilters = observer(function MyItemsQuickFilters(props: TMyItemsQuickFiltersProps) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { data: currentUser } = useUser();
  const { getFilter } = useWorkItemFilters();
  // refs
  const appliedDefaultKeyRef = useRef<string | null>(null);

  const userId = currentUser?.id;

  const assignedCondition = useMemo<TWorkItemFilterConditionData | undefined>(
    () => (userId ? { assignee_id__in: userId } : undefined),
    [userId]
  );
  const createdCondition = useMemo<TWorkItemFilterConditionData | undefined>(
    () => (userId ? { created_by_id__in: userId } : undefined),
    [userId]
  );

  const projectFilters = issuesFilter.getIssueFilters(projectId);
  const isFiltersLoaded = projectFilters !== undefined;
  const conditions = toConditions(projectFilters?.richFilters);

  const isAssignedActive = assignedCondition
    ? conditions.some((condition) => isConditionEqual(condition, assignedCondition))
    : false;
  const isCreatedActive = createdCondition
    ? conditions.some((condition) => isConditionEqual(condition, createdCondition))
    : false;

  const applyExpression = useCallback(
    (nextExpression: TWorkItemFilterExpression, hasConditions: boolean) => {
      // Dronolab: keep WorkItemFiltersRow in sync when its FilterInstance is mounted; fall back to issuesFilter directly.
      const filterInstance = getFilter(EIssuesStoreType.PROJECT, projectId);
      const canUseFilterInstance =
        Boolean(filterInstance?.onExpressionChange) &&
        (!hasConditions || filterInstance?.adapter.toInternal(nextExpression) !== null);

      if (filterInstance && canUseFilterInstance) {
        filterInstance.resetExpression(nextExpression, false);
      } else {
        void issuesFilter.updateFilterExpression(workspaceSlug, projectId, nextExpression);
      }
    },
    [getFilter, issuesFilter, projectId, workspaceSlug]
  );

  const toggleCondition = useCallback(
    (target: TWorkItemFilterConditionData) => {
      const currentConditions = toConditions(issuesFilter.getIssueFilters(projectId)?.richFilters);
      const wasActive = currentConditions.some((condition) => isConditionEqual(condition, target));
      const nextConditions = currentConditions.filter((condition) => !isConditionEqual(condition, target));
      if (!wasActive) {
        nextConditions.push(target);
      }
      applyExpression(fromConditions(nextConditions), nextConditions.length > 0);
    },
    [applyExpression, issuesFilter, projectId]
  );

  // The filter bar's instance is created after the saved filters load; applying the default before it
  // exists gets overwritten when it initialises with the old (empty) filters.
  const isFilterInstanceReady = !!getFilter(EIssuesStoreType.PROJECT, projectId);

  // Dronolab: enable "Assigned to me" by default on the first visit per project+user; subsequent choices persist.
  useEffect(() => {
    if (!isFiltersLoaded || !isFilterInstanceReady || !userId || !assignedCondition) return;

    const storageKey = `dronolab:my-items-default:v2:${projectId}:${userId}`;
    if (appliedDefaultKeyRef.current === storageKey) return;
    appliedDefaultKeyRef.current = storageKey;

    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(storageKey) !== null) return;
      window.localStorage.setItem(storageKey, "1");
    } catch {
      return;
    }

    const currentConditions = toConditions(issuesFilter.getIssueFilters(projectId)?.richFilters);
    const alreadyAssigned = currentConditions.some((condition) => isConditionEqual(condition, assignedCondition));
    if (!alreadyAssigned) {
      toggleCondition(assignedCondition);
    }
  }, [assignedCondition, isFiltersLoaded, isFilterInstanceReady, issuesFilter, projectId, toggleCondition, userId]);

  if (!userId || !assignedCondition || !createdCondition) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant={isAssignedActive ? "primary" : "secondary"}
        size="md"
        stretch="auto"
        label="Assigned to me"
        aria-pressed={isAssignedActive}
        onClick={() => toggleCondition(assignedCondition)}
      />
      <Button
        type="button"
        variant={isCreatedActive ? "primary" : "secondary"}
        size="md"
        stretch="auto"
        label="Created by me"
        aria-pressed={isCreatedActive}
        onClick={() => toggleCondition(createdCondition)}
      />
    </div>
  );
});
