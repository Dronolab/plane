/**
 * Dronolab: API calls for the Epics section (backend: apps/api/plane/app/views/issue/epic.py).
 */

import { API_BASE_URL } from "@plane/constants";
import type { TIssue } from "@plane/types";
import { APIService } from "@/services/api.service";

export type TEpicListItem = Pick<
  TIssue,
  "id" | "name" | "sequence_id" | "project_id" | "state_id" | "priority" | "start_date" | "target_date" | "sub_issues_count"
> & { state__group?: string };

export type TEpicProgress = {
  total: number;
  backlog: number;
  unstarted: number;
  started: number;
  completed: number;
  cancelled: number;
  progress: number;
  stories: number;
};

export type TEpicChild = Pick<
  TIssue,
  "id" | "name" | "sequence_id" | "project_id" | "state_id" | "priority" | "target_date" | "sub_issues_count"
> & { state_group?: string };

export class EpicService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private base(workspaceSlug: string, projectId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}`;
  }

  async list(workspaceSlug: string, projectId: string): Promise<TEpicListItem[]> {
    return this.get(`${this.base(workspaceSlug, projectId)}/v2/epics/`, { params: { per_page: 1000 } })
      .then((response) => response?.data?.results ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: Partial<TIssue>): Promise<TIssue> {
    return this.post(`${this.base(workspaceSlug, projectId)}/epics/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, epicId: string): Promise<TIssue> {
    return this.get(`${this.base(workspaceSlug, projectId)}/epics/${epicId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async progress(workspaceSlug: string, projectId: string, epicId: string): Promise<TEpicProgress> {
    return this.get(`${this.base(workspaceSlug, projectId)}/epics/${epicId}/progress/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async children(workspaceSlug: string, projectId: string, epicId: string): Promise<TEpicChild[]> {
    return this.get(`${this.base(workspaceSlug, projectId)}/epics/${epicId}/sub-issues/`)
      .then((response) => response?.data?.sub_issues ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
