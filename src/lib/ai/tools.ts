import type { FunctionDeclaration } from '@google/genai'
import { PRIORITIES } from '../format'

// The functions Gemini may call. Each maps to one or more existing store actions
// in executeTool.ts, so the assistant manipulates the real board — it never fakes
// a change. Descriptions are written for the model: prescriptive about *when* to
// use each, since that improves function selection. We use `parametersJsonSchema`
// so the schema is plain JSON Schema (not Gemini's OpenAPI Schema type).
export const ASSISTANT_TOOLS: FunctionDeclaration[] = [
  {
    name: 'add_task',
    description:
      'Create a new task (card) in a column. Use for any "add", "create", "new task", or "make a card" request. Returns the new task id so you can set fields on it next.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The task title.' },
        column: {
          type: 'string',
          description:
            'Which column to add it to, matched by title (e.g. "To do", "In progress", "Done", "Backlog"). Defaults to the first column if omitted.',
        },
        priority: { type: 'string', enum: PRIORITIES, description: 'Optional priority.' },
        description: { type: 'string', description: 'Optional longer description.' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags.' },
        dueInDays: {
          type: 'integer',
          description: 'Optional due date, expressed as a number of days from today (0 = today).',
        },
        checklist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional checklist item texts to add to the task.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description:
      'Change fields on an existing task: title, priority, description, tags, or due date. Identify the task by id (preferred) or by a substring of its current title.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The task id, if known.' },
        titleMatch: {
          type: 'string',
          description: 'A substring of the task title, used when the id is unknown.',
        },
        title: { type: 'string', description: 'New title.' },
        priority: { type: 'string', enum: PRIORITIES },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Replaces the existing tags.' },
        dueInDays: {
          type: 'integer',
          description: 'New due date as days from today. Use null to clear the due date.',
        },
      },
    },
  },
  {
    name: 'move_task',
    description:
      'Move a task to a different column. Use for "move X to Done", "mark X as in progress", etc.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        titleMatch: { type: 'string', description: 'A substring of the task title if the id is unknown.' },
        toColumn: { type: 'string', description: 'Target column, matched by title.' },
      },
      required: ['toColumn'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task. Only use when the user clearly asks to remove or delete a task.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        titleMatch: { type: 'string', description: 'A substring of the task title if the id is unknown.' },
      },
    },
  },
  {
    name: 'add_checklist_item',
    description: 'Add one checklist (subtask) item to an existing task.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        titleMatch: { type: 'string', description: 'A substring of the task title if the id is unknown.' },
        text: { type: 'string', description: 'The checklist item text.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'add_column',
    description:
      'Create a new column (list / lane) on the board. Use for "add a column", "make a new list", "create a lane".',
    parametersJsonSchema: {
      type: 'object',
      properties: { title: { type: 'string', description: 'The column title.' } },
      required: ['title'],
    },
  },
  {
    name: 'rename_column',
    description: 'Rename an existing column.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        columnMatch: { type: 'string', description: 'A substring of the current column title.' },
        title: { type: 'string', description: 'The new title.' },
      },
      required: ['columnMatch', 'title'],
    },
  },
  {
    name: 'set_view',
    description: 'Switch the board view. Use for "show the calendar", "go to timeline", "list view", etc.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        view: { type: 'string', enum: ['kanban', 'list', 'calendar', 'timeline'] },
      },
      required: ['view'],
    },
  },
  {
    name: 'set_theme',
    description: 'Change the colour theme. Use for "dark mode", "light mode", "high contrast".',
    parametersJsonSchema: {
      type: 'object',
      properties: { theme: { type: 'string', enum: ['light', 'dark', 'contrast'] } },
      required: ['theme'],
    },
  },
  {
    name: 'set_filter',
    description:
      'Filter the board by a search query and/or priorities. Pass an empty query and empty priorities to clear filters.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to search task titles/descriptions for.' },
        priorities: {
          type: 'array',
          items: { type: 'string', enum: PRIORITIES },
          description: 'Only show tasks with these priorities.',
        },
      },
    },
  },
]
