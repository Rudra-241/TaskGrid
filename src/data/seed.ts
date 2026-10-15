import { nanoid } from 'nanoid'
import type { Board, Preferences } from '../types'

function iso(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

const now = new Date().toISOString()

// Build a demo board that showcases every card feature.
export function makeSeedBoard(): Board {
  const t = (
    title: string,
    priority: Board['tasks'][string]['priority'],
    tags: string[],
    dueOffset: number | null,
    description = '',
    checklist: { text: string; done: boolean }[] = [],
  ) => {
    const id = nanoid(8)
    return {
      id,
      task: {
        id,
        title,
        description,
        priority,
        tags,
        dueDate: dueOffset === null ? null : iso(dueOffset),
        checklist: checklist.map((c) => ({ id: nanoid(6), text: c.text, done: c.done })),
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  const items = [
    t('Sketch onboarding flow', 'high', ['design', 'ux'], 1, 'Low-fidelity wireframes for the first-run guided tour.', [
      { text: 'Welcome step', done: true },
      { text: 'Highlight command palette', done: false },
      { text: 'Explain adaptive modes', done: false },
    ]),
    t('Audit colour contrast', 'urgent', ['a11y'], 0, 'Verify every text pair meets WCAG AA in all three themes.'),
    t('Wire up drag and drop', 'high', ['dev'], 2, 'Keyboard-accessible reordering with screen-reader announcements.', [
      { text: 'Pointer sensor', done: true },
      { text: 'Keyboard sensor', done: true },
      { text: 'Live region messages', done: false },
    ]),
    t('Write persona profiles', 'medium', ['research'], 3, 'New user, power user, and focus-seeker personas for the report.'),
    t('Calendar view spike', 'medium', ['dev'], 5, 'Month grid that places tasks on their due dates.'),
    t('Usability test script', 'low', ['research', 'ux'], 7, 'Five tasks covering search, filtering, and view switching.'),
    t('Set up local persistence', 'high', ['dev'], null, 'Debounced localStorage so no backend is required.', [
      { text: 'Serialize state', done: true },
      { text: 'Migrate on load', done: true },
    ]),
    t('Timeline density study', 'low', ['research'], 9, 'How many tasks fit before the timeline feels crowded.'),
    t('Ship dark and high-contrast', 'medium', ['design', 'a11y'], 4, 'Three themes driven entirely by CSS custom properties.'),
    t('Record demo walkthrough', 'low', ['ops'], 12, 'Two-minute screen capture for the presentation.'),
  ]

  const tasks: Board['tasks'] = {}
  items.forEach((i) => {
    tasks[i.id] = i.task
  })

  const [
    onboarding,
    contrast,
    dnd,
    persona,
    calendar,
    script,
    persistence,
    timeline,
    themes,
    demo,
  ] = items.map((i) => i.id)

  return {
    tasks,
    columns: [
      { id: 'backlog', title: 'Backlog', accent: 'var(--secondary)', taskIds: [persona, script, timeline, demo] },
      { id: 'todo', title: 'To do', accent: 'var(--accent)', taskIds: [onboarding, calendar, themes] },
      { id: 'doing', title: 'In progress', accent: 'var(--primary)', taskIds: [dnd, contrast] },
      { id: 'done', title: 'Done', accent: 'var(--primary)', taskIds: [persistence] },
    ],
  }
}

export const defaultPrefs: Preferences = {
  theme: 'light',
  mode: 'new',
  density: 'comfortable',
  view: 'kanban',
  animationsEnabled: true,
  showTooltips: true,
  showSidebar: true,
  showInspector: true,
  cardFields: {
    tags: true,
    dueDate: true,
    priority: true,
    checklist: true,
    description: true,
  },
  onboardingDone: false,
}
