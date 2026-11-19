/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChatOutline, DocumentationOutline, Github, RocketOutline } from "@makeplane/propel/icons";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// helpers
import { DRONOLAB_DISCORD_URL, DRONOLAB_GUIDE_URL, DRONOLAB_ISSUES_URL } from "@/helpers/dronolab";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";

/**
 * Help commands - Help related commands
 */
export const usePowerKHelpCommands = (): TPowerKCommandConfig[] => {
  // store
  const { toggleShortcutsListModal } = usePowerK();

  return [
    {
      id: "open_keyboard_shortcuts",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_keyboard_shortcuts",
      icon: RocketOutline,
      modifierShortcut: "cmd+/",
      action: () => toggleShortcutsListModal(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "open_plane_documentation",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_plane_documentation",
      icon: DocumentationOutline,
      action: () => {
        // Dronolab: point documentation command to Dronolab guide
        window.open(DRONOLAB_GUIDE_URL, "_blank", "noopener,noreferrer");
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "join_forum",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.join_forum",
      icon: ChatOutline,
      action: () => {
        // Dronolab: point forum command to Dronolab Discord
        window.open(DRONOLAB_DISCORD_URL, "_blank", "noopener,noreferrer");
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "report_bug",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.report_bug",
      icon: Github,
      action: () => {
        // Dronolab: point bug report command to Dronolab issues
        window.open(DRONOLAB_ISSUES_URL, "_blank", "noopener,noreferrer");
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
