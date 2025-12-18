// Project store - manages project and prompt selection
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Project, Prompt } from '@/types/models';

interface ProjectState {
  // All projects
  projects: Project[];

  // Currently selected project
  currentProject: Project | null;

  // Prompts for current project
  prompts: Prompt[];

  // Currently selected prompt
  currentPrompt: Prompt | null;

  // Loading states
  isLoadingProjects: boolean;
  isLoadingPrompts: boolean;
  isSaving: boolean;
}

interface ProjectActions {
  // Project management
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  selectProject: (project: Project | null) => void;

  // Prompt management
  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  removePrompt: (id: string) => void;
  selectPrompt: (prompt: Prompt | null) => void;

  // Loading states
  setLoadingProjects: (loading: boolean) => void;
  setLoadingPrompts: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  prompts: [],
  currentPrompt: null,
  isLoadingProjects: false,
  isLoadingPrompts: false,
  isSaving: false,
};

export const useProjectStore = create<ProjectState & ProjectActions>()(
  immer((set) => ({
    ...initialState,

    // Project management
    setProjects: (projects) =>
      set((state) => {
        state.projects = projects;
      }),

    addProject: (project) =>
      set((state) => {
        state.projects.unshift(project);
      }),

    updateProject: (id, updates) =>
      set((state) => {
        const index = state.projects.findIndex((p) => p.id === id);
        if (index >= 0) {
          state.projects[index] = { ...state.projects[index], ...updates };
        }
        if (state.currentProject?.id === id) {
          state.currentProject = { ...state.currentProject, ...updates };
        }
      }),

    removeProject: (id) =>
      set((state) => {
        state.projects = state.projects.filter((p) => p.id !== id);
        if (state.currentProject?.id === id) {
          state.currentProject = null;
          state.prompts = [];
          state.currentPrompt = null;
        }
      }),

    selectProject: (project) =>
      set((state) => {
        state.currentProject = project;
        // Clear prompts when changing project
        state.prompts = [];
        state.currentPrompt = null;
      }),

    // Prompt management
    setPrompts: (prompts) =>
      set((state) => {
        state.prompts = prompts;
      }),

    addPrompt: (prompt) =>
      set((state) => {
        state.prompts.unshift(prompt);
      }),

    updatePrompt: (id, updates) =>
      set((state) => {
        const index = state.prompts.findIndex((p) => p.id === id);
        if (index >= 0) {
          state.prompts[index] = { ...state.prompts[index], ...updates };
        }
        if (state.currentPrompt?.id === id) {
          state.currentPrompt = { ...state.currentPrompt, ...updates };
        }
      }),

    removePrompt: (id) =>
      set((state) => {
        state.prompts = state.prompts.filter((p) => p.id !== id);
        if (state.currentPrompt?.id === id) {
          state.currentPrompt = null;
        }
      }),

    selectPrompt: (prompt) =>
      set((state) => {
        state.currentPrompt = prompt;
      }),

    // Loading states
    setLoadingProjects: (loading) =>
      set((state) => {
        state.isLoadingProjects = loading;
      }),

    setLoadingPrompts: (loading) =>
      set((state) => {
        state.isLoadingPrompts = loading;
      }),

    setSaving: (saving) =>
      set((state) => {
        state.isSaving = saving;
      }),

    // Reset
    reset: () => set(initialState),
  }))
);
