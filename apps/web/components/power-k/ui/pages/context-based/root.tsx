/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import type { TPowerKCommandConfig, TPowerKContextType, TPowerKPageType } from "@/components/power-k/core/types";
// local imports
// Dronolab: no cycles/modules
import { PowerKModuleContextBasedPages } from "./module";
import { usePowerKPageContextBasedActions } from "./page/commands";
import { PowerKWorkItemContextBasedPages } from "./work-item";
import { usePowerKWorkItemContextBasedCommands } from "./work-item/commands";

export type ContextBasedActionsProps = {
  activePage: TPowerKPageType | null;
  activeContext: TPowerKContextType | null;
  handleSelection: (data: unknown) => void;
};

export function PowerKContextBasedPagesList(props: ContextBasedActionsProps) {
  const { activeContext, activePage, handleSelection } = props;

  return (
    <>
      {activeContext === "work-item" && (
        <PowerKWorkItemContextBasedPages activePage={activePage} handleSelection={handleSelection} />
      )}
      {activeContext === "module" && (
        <PowerKModuleContextBasedPages activePage={activePage} handleSelection={handleSelection} />
      )}
    </>
  );
}

export const usePowerKContextBasedActions = (): TPowerKCommandConfig[] => {
  const workItemCommands = usePowerKWorkItemContextBasedCommands();
  const pageCommands = usePowerKPageContextBasedActions();

  // Dronolab: no cycles/modules
  return [...workItemCommands, ...pageCommands];
};
