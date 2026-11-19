# Dronolab: Epics and Stories

Goal: a full Epics section in the free (community) edition, like Plane's paid
Epics, plus Story and Task work item types. Built on what upstream already ships
(the `issue_types` table, `Issue.type`, the web app's epic store and `isEpic`
code paths) so the fork stays close to upstream.

## Model

| Level | How it is stored | Can be under |
|---|---|---|
| Epic | `IssueType` "Epic", `is_epic=True`, level 0 | nothing |
| Story | `IssueType` "Story", level 1 | an Epic, or nothing |
| Task | `IssueType` "Task", `is_default=True`, level 2 | a Story, an Epic, or nothing |
| Subtask | a Task's sub-work item (existing feature), type Task | a Task |

Each workspace gets the three types (data migration for existing ones, signal for
new ones); each project links them through `ProjectIssueType` when Epics is on.

## Phases

1. **Backend** (`apps/api`)
   - Seed the types; enable them per project (project feature flag `is_epic_enabled`).
   - `/projects/{id}/epics/`, `/epics/{id}/`, `/epics-detail/`, `/v2/epics/`: same
     behaviour as the work item endpoints, limited to epics; creating sets the
     Epic type.
   - `/epics/{id}/progress/`: counts of the epic's stories and tasks by state group.
   - Normal work item lists leave epics out (they live in their own section).
   - Nesting rules on create/update (no parent for an Epic; a Story's parent is an Epic).
   - Build the backend image; check every endpoint with the API.
2. **Epics section** (`apps/web`)
   - Sidebar entry "Epics" under the project (next to Work items, Cycles, Modules).
   - `/projects/{id}/epics` list/board page and `/epics/{epicId}` detail page,
     reusing the work item layouts and detail with `isEpic`.
   - Point the epic store at the epics service.
   - Progress bar and the epic's stories on the detail page.
3. **Stories and Tasks**
   - Type badge on work items; type picker in the create modal and properties.
   - Filter and group by type.
4. **Test data and polish**
   - Turn the demo tree (DRONO-32..54) into a real Epic > Stories > Tasks > Subtasks.
   - French labels where the UI is ours; empty states.

Each phase ends with a build and a check in the running app before the next starts.
