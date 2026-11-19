/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
// components
import type { TIssue, IIssueDisplayProperties, TIssueMap, TGroupedIssues } from "@plane/types";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// types
import { IssueBlockRoot } from "./block-root";
import type { TRenderQuickActions } from "./list-view-types";

interface Props {
  issueIds: TGroupedIssues | any;
  issuesMap: TIssueMap;
  groupId: string;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  isDragAllowed: boolean;
  canDropOverIssue: boolean;
  selectionHelpers: TSelectionHelper;
  isEpic?: boolean;
}

/**
 * Dronolab: split a group's work items into a tree. An item whose parent is in the same group is
 * shown only nested under that parent (not a second time at the top level); the others are roots.
 * Children keep the group's sort order.
 */
const buildGroupTree = (issueIds: string[], issuesMap: TIssueMap) => {
  const inGroup = new Set(issueIds);
  const childrenMap: Record<string, string[]> = {};
  const rootIds: string[] = [];
  for (const issueId of issueIds) {
    const parentId = issuesMap[issueId]?.parent_id;
    if (parentId && parentId !== issueId && inGroup.has(parentId)) {
      (childrenMap[parentId] ??= []).push(issueId);
    } else {
      rootIds.push(issueId);
    }
  }
  return { rootIds, childrenMap };
};

export const IssueBlocksList = observer(function IssueBlocksList(props: Props) {
  const {
    issueIds,
    issuesMap,
    groupId,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    containerRef,
    selectionHelpers,
    isDragAllowed,
    canDropOverIssue,
    isEpic = false,
  } = props;

  const { rootIds, childrenMap }: { rootIds: string[]; childrenMap: Record<string, string[]> } =
    Array.isArray(issueIds) && !isEpic
      ? buildGroupTree(issueIds as string[], issuesMap)
      : { rootIds: Array.isArray(issueIds) ? (issueIds as string[]) : [], childrenMap: {} };

  return (
    <div className="relative h-full w-full">
      {rootIds.length > 0 &&
        rootIds.map((issueId: string, index: number) => (
          <IssueBlockRoot
            key={issueId}
            issueId={issueId}
            issuesMap={issuesMap}
            updateIssue={updateIssue}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            displayProperties={displayProperties}
            nestingLevel={0}
            spacingLeft={0}
            containerRef={containerRef}
            selectionHelpers={selectionHelpers}
            groupId={groupId}
            isLastChild={index === rootIds.length - 1}
            isDragAllowed={isDragAllowed}
            canDropOverIssue={canDropOverIssue}
            isEpic={isEpic}
            listChildrenMap={childrenMap}
          />
        ))}
    </div>
  );
});
