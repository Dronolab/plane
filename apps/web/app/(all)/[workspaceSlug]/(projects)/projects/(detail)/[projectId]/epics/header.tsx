import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EpicOutline } from "@makeplane/propel/icons";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { useProjectCrumbProps } from "@/components/breadcrumbs/use-project-crumb-props";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useProject } from "@/hooks/store/use-project";

// Dronolab: Epics section

export const EpicsHeader = observer(function EpicsHeader() {
  const { workspaceSlug = "", projectId = "", epicId } = useParams<{
    workspaceSlug?: string;
    projectId?: string;
    epicId?: string;
  }>();
  const projectCrumb = useProjectCrumbProps(workspaceSlug || undefined, projectId || undefined);
  const { loader } = useProject();

  const hasEpic = Boolean(epicId);

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug} projectId={projectId} {...projectCrumb} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Epics"
                href={`/${workspaceSlug}/projects/${projectId}/epics`}
                icon={<EpicOutline className="h-4 w-4 text-tertiary" />}
                isLast={!hasEpic}
              />
            }
            isLast={!hasEpic}
          />
          {hasEpic && <Breadcrumbs.Item component={<BreadcrumbLink label="Epic" isLast />} isLast />}
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
