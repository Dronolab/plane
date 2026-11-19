/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RouteConfigEntry } from "@react-router/dev/routes";
import { layout, route } from "@react-router/dev/routes";

// Dronolab: Epics section
const EPICS = "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/epics";

// Nested in the same layouts as the project pages (mergeRoutes merges by layout file).
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/layout.tsx", [
          layout(`${EPICS}/layout.tsx`, [
            route(":workspaceSlug/projects/:projectId/epics", `${EPICS}/page.tsx`),
            route(":workspaceSlug/projects/:projectId/epics/:epicId", `${EPICS}/[epicId]/page.tsx`),
          ]),
        ]),
      ]),
    ]),
  ]),
];
