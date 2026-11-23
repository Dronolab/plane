/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
// assets
import ProjectDarkEmptyState from "@/app/assets/empty-state/project-settings/no-projects-dark.png?url";
import ProjectLightEmptyState from "@/app/assets/empty-state/project-settings/no-projects-light.png?url";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";

function ProjectSettingsPage() {
  // store hooks
  const { resolvedTheme } = useTheme();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const resolvedPath = resolvedTheme === "dark" ? ProjectDarkEmptyState : ProjectLightEmptyState;
  const canCreateProject = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col items-center justify-center gap-4">
      <img src={resolvedPath} alt="No projects yet" />
      <div className="text-body-md-semibold text-tertiary">No projects yet</div>
      <div className="text-center text-body-xs-regular text-tertiary">
        Projects act as the foundation for goal-driven work. They let you manage your teams, tasks, and everything you
        need to get things done.
      </div>
      {/* Dronolab: no "Learn more" link to plane.so */}
      {canCreateProject && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            label="Start your first project"
            onClick={() => toggleCreateProjectModal(true)}
          />
        </div>
      )}
    </div>
  );
}

export default observer(ProjectSettingsPage);
