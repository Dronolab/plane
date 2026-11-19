/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";
// local components
import { Button } from "@makeplane/propel/components/button";
import { DRONOLAB_WEBSITE_URL } from "@/helpers/dronolab";

// Dronolab: the badge links to the club's website instead of opening Plane's paid-plan upsell.
export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  // translation
  const { t } = useTranslation();
  // platform
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip label={`Version: v${packageJson.version}`} disabled={isMobile}>
      <Button
        variant="tertiary"
        size="md"
        stretch="auto"
        label="Dronolab"
        onClick={() => window.open(DRONOLAB_WEBSITE_URL, "_blank", "noopener,noreferrer")}
        aria-label={t("aria_labels.projects_sidebar.edition_badge")}
      />
    </Tooltip>
  );
});
