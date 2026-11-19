import { useState, type FormEvent } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { EpicOutline } from "@makeplane/propel/icons";
import { PageHead } from "@/components/core/page-title";
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

function EpicProgressBar({
  workspaceSlug,
  projectId,
  epicId,
}: {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
}) {
  const { data } = useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_PROGRESS_${workspaceSlug}_${projectId}_${epicId}` : null,
    () => epicService.progress(workspaceSlug, projectId, epicId)
  );

  const progress = Math.min(100, Math.max(0, data?.progress ?? 0));
  const completed = data?.completed ?? 0;
  const counted = data ? Math.max(0, data.total - data.cancelled) : 0;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-layer-3">
        <div className="h-full rounded-full bg-success-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="min-w-10 text-right text-caption-sm-regular text-tertiary">
        {data ? `${completed}/${counted}` : "—"}
      </span>
    </div>
  );
}

function EpicsListPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { getProjectById } = useProject();

  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const project = getProjectById(projectId);
  const identifier = project?.identifier;
  const pageTitle = project?.name ? `${project.name} - Epics` : "Epics";

  const {
    data: epics,
    isLoading,
    mutate,
  } = useSWR(
    workspaceSlug && projectId ? `EPICS_LIST_${workspaceSlug}_${projectId}` : null,
    () => epicService.list(workspaceSlug, projectId)
  );

  const sortedEpics = epics ? [...epics].sort((a, b) => b.sequence_id - a.sequence_id) : [];

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isCreating) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      await epicService.create(workspaceSlug, projectId, { name: trimmed });
      setName("");
      await mutate();
    } catch {
      setCreateError("Failed to create epic.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-1.5">
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Epic name…"
              disabled={isCreating}
              className="flex-1 rounded-md border border-subtle bg-layer-1 px-3 py-2 text-body-sm-regular text-primary outline-none focus:border-accent-strong disabled:opacity-60"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              stretch="auto"
              label="Create epic"
              disabled={isCreating || !name.trim()}
              loading={isCreating}
            />
          </form>
          {createError && <p className="text-body-xs-regular text-danger-primary">{createError}</p>}
        </div>

        {isLoading && !epics ? (
          <p className="text-body-sm-regular text-tertiary">Loading…</p>
        ) : sortedEpics.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-subtle bg-layer-1 px-6 py-16 text-center">
            <EpicOutline className="h-8 w-8 text-tertiary" />
            <p className="text-body-sm-regular text-secondary">
              No epics yet. Create one above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-subtle overflow-hidden rounded-md border border-subtle bg-layer-1">
            {sortedEpics.map((epic) => {
              const keyLabel = identifier ? `${identifier}-${epic.sequence_id}` : `#${epic.sequence_id}`;
              const childCount = epic.sub_issues_count ?? 0;
              return (
                <Link
                  key={epic.id}
                  href={`/${workspaceSlug}/projects/${projectId}/epics/${epic.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-layer-1-hover"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="shrink-0 font-mono text-body-xs-medium text-tertiary">{keyLabel}</span>
                    <span className="truncate text-body-sm-medium text-primary">{epic.name}</span>
                    <StateGroupPill group={epic.state__group} />
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-body-xs-regular text-tertiary">
                    {epic.target_date && <span>{epic.target_date}</span>}
                    <span>
                      {childCount} {childCount === 1 ? "item" : "items"}
                    </span>
                    <EpicProgressBar workspaceSlug={workspaceSlug} projectId={projectId} epicId={epic.id} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default observer(EpicsListPage);
