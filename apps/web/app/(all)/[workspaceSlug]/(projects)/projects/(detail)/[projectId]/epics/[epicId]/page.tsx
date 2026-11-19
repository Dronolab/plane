import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { PageHead } from "@/components/core/page-title";
// Dronolab: work item type badge for epic children
import { WorkItemTypeBadge } from "@/components/issues/work-item-type-badge";
import { useProject } from "@/hooks/store/use-project";
import { EpicService } from "@/services/epic.service";
import type { Route } from "./+types/page";

// Dronolab: Epics section

const epicService = new EpicService();

const STATE_GROUP_META: Record<string, { label: string; className: string }> = {
  backlog: { label: "Backlog", className: "bg-layer-2 text-tertiary" },
  unstarted: { label: "Todo", className: "bg-layer-2 text-secondary" },
  started: { label: "In progress", className: "bg-accent-primary/15 text-accent-primary" },
  completed: { label: "Done", className: "bg-success-subtle text-success-primary" },
  cancelled: { label: "Cancelled", className: "bg-layer-2 text-tertiary line-through" },
};

function StateGroupPill({ group }: { group?: string }) {
  if (!group) return null;
  const meta = STATE_GROUP_META[group] ?? { label: group, className: "bg-layer-2 text-secondary" };
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-caption-sm-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function hasNonEmptyHtml(html?: string): boolean {
  if (!html) return false;
  const trimmed = html.trim();
  if (!trimmed) return false;
  if (trimmed.replace(/<[^>]*>/g, "").trim().length > 0) return true;
  return /<(img|video|iframe|table|hr)\b/i.test(trimmed);
}

function EpicDetailPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId, epicId } = params;
  const { getProjectById } = useProject();

  const project = getProjectById(projectId);
  const identifier = project?.identifier;

  const {
    data: epic,
    error: epicError,
    isLoading: isEpicLoading,
  } = useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_DETAIL_${workspaceSlug}_${projectId}_${epicId}` : null,
    () => epicService.retrieve(workspaceSlug, projectId, epicId)
  );

  const { data: progress } = useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_PROGRESS_${workspaceSlug}_${projectId}_${epicId}` : null,
    () => epicService.progress(workspaceSlug, projectId, epicId)
  );

  const { data: children, isLoading: isChildrenLoading } = useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_CHILDREN_${workspaceSlug}_${projectId}_${epicId}` : null,
    () => epicService.children(workspaceSlug, projectId, epicId)
  );

  const epicKey = epic ? (identifier ? `${identifier}-${epic.sequence_id}` : `#${epic.sequence_id}`) : undefined;
  const pageTitle = epic && epicKey ? `${epicKey} ${epic.name}` : project?.name ? `${project.name} - Epic` : "Epic";

  if (isEpicLoading && !epic && !epicError) {
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <p className="text-body-sm-regular text-tertiary">Loading…</p>
        </div>
      </>
    );
  }

  if (epicError || !epic) {
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-3 px-6 py-8">
          <p className="text-body-md-medium text-primary">Epic not found.</p>
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/epics`}
            className="inline-flex items-center rounded-md border border-subtle bg-layer-1 px-3 py-1.5 text-body-xs-medium text-primary transition-colors hover:bg-layer-1-hover"
          >
            Back to epics
          </Link>
        </div>
      </>
    );
  }

  const progressPercent = Math.min(100, Math.max(0, progress?.progress ?? 0));
  const progressGroups = progress
    ? [
        { key: "backlog", label: "Backlog", count: progress.backlog },
        { key: "unstarted", label: "Todo", count: progress.unstarted },
        { key: "started", label: "In progress", count: progress.started },
        { key: "completed", label: "Done", count: progress.completed },
        { key: "cancelled", label: "Cancelled", count: progress.cancelled },
      ]
    : [];

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-mono text-body-xs-medium text-tertiary">{epicKey}</span>
            <h1 className="text-h4-semibold text-primary">{epic.name}</h1>
          </div>
          {identifier && (
            <Link
              href={`/${workspaceSlug}/browse/${identifier}-${epic.sequence_id}`}
              className="inline-flex shrink-0 items-center rounded-md border border-subtle bg-layer-1 px-3 py-2 text-body-xs-medium text-primary transition-colors hover:bg-layer-1-hover"
            >
              Open as work item
            </Link>
          )}
        </div>

        {hasNonEmptyHtml(epic.description_html) && (
          <div className="rounded-md border border-subtle bg-layer-1 p-4">
            <div
              className="prose prose-sm max-w-none space-y-2 text-secondary"
              dangerouslySetInnerHTML={{ __html: epic.description_html ?? "" }}
            />
          </div>
        )}

        <section className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-body-sm-medium text-primary">{progressPercent}% complete</span>
            {progress && (
              <span className="text-body-xs-regular text-tertiary">
                {progress.stories} {progress.stories === 1 ? "story" : "stories"}
              </span>
            )}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-layer-3">
            <div
              className="h-full rounded-full bg-success-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progress && (
            <div className="flex flex-wrap items-center gap-3 text-body-xs-regular text-secondary">
              {progressGroups.map((group) => (
                <div
                  key={group.key}
                  className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2.5 py-1"
                >
                  <span className="text-tertiary">{group.label}</span>
                  <span className="text-body-xs-medium text-primary">{group.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-h6-semibold text-primary">Epic items</h2>
          {isChildrenLoading && !children ? (
            <p className="text-body-sm-regular text-tertiary">Loading…</p>
          ) : !children || children.length === 0 ? (
            <div className="rounded-md border border-subtle bg-layer-1 px-4 py-6 text-body-sm-regular text-tertiary">
              No items in this epic.
            </div>
          ) : (
            <div className="divide-y divide-subtle overflow-hidden rounded-md border border-subtle bg-layer-1">
              {children.map((child) => {
                const childKey = identifier ? `${identifier}-${child.sequence_id}` : `#${child.sequence_id}`;
                const subCount = child.sub_issues_count ?? 0;
                const rowContent = (
                  <>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {/* Dronolab: work item type badge before identifier */}
                      <WorkItemTypeBadge projectId={projectId} typeId={child.type_id} />
                      <span className="shrink-0 font-mono text-body-xs-medium text-tertiary">{childKey}</span>
                      <span className="truncate text-body-sm-medium text-primary">{child.name}</span>
                      <StateGroupPill group={child.state_group} />
                    </div>
                    <span className="shrink-0 text-body-xs-regular text-tertiary">
                      {subCount} {subCount === 1 ? "sub-item" : "sub-items"}
                    </span>
                  </>
                );

                if (!identifier) {
                  return (
                    <div key={child.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      {rowContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={child.id}
                    href={`/${workspaceSlug}/browse/${identifier}-${child.sequence_id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-layer-1-hover"
                  >
                    {rowContent}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default observer(EpicDetailPage);
