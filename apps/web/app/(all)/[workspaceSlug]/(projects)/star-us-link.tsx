/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { GlobeOutline } from "@makeplane/propel/icons";
// Dronolab: the top bar links to the club's website instead of "Star us on GitHub".
import { DRONOLAB_WEBSITE_URL } from "@/helpers/dronolab";

const GITHUB_REPO_URL = DRONOLAB_WEBSITE_URL;
const Github = GlobeOutline;

export function StarUsOnGitHubLink() {
  const label = "Dronolab";

  return (
    <>
      {/* labelled tertiary button from md up; icon-only below, as the label used to hide there */}
      <span className="hidden shrink-0 md:flex">
        <Button
          variant="tertiary"
          size="md"
          stretch="auto"
          nativeButton={false}
          render={<a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label={label} />}
          icon={<Icon icon={Github} />}
          label={label}
        />
      </span>
      <span className="flex shrink-0 md:hidden">
        <IconButton
          variant="tertiary"
          size="md"
          nativeButton={false}
          render={<a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label={label} />}
          icon={<Icon icon={Github} />}
          aria-label={label}
          showTooltip={false}
        />
      </span>
    </>
  );
}
