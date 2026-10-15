import { GoogleGenAI, type Content } from '@google/genai'
import type { AppState } from '../../types'
import { getApiKey } from './apiKey'
import { ASSISTANT_TOOLS } from './tools'
import { executeTool, type ToolContext } from './executeTool'

const MODEL = 'gemini-2.5-flash'
const MAX_TURNS = 6 // guard against runaway tool loops

// A compact snapshot of the board so the model knows what exists (column titles,
// task titles + ids + priority). Kept small deliberately — it is rebuilt every
// call, so it should not balloon the prompt.
function boardSummary(state: AppState): string {
  const lines = state.board.columns.map((col) => {
    const tasks = col.taskIds
      .map((id) => state.board.tasks[id])
      .filter(Boolean)
      .map((t) => `    - "${t.title}" (id ${t.id}, ${t.priority}${t.tags.length ? `, tags: ${t.tags.join('/')}` : ''})`)
    return `  ${col.title} [${col.taskIds.length}]:\n${tasks.join('\n') || '    (empty)'}`
  })
  return `Columns and tasks:\n${lines.join('\n')}\nCurrent view: ${state.prefs.view}. Theme: ${state.prefs.theme}.`
}

const SYSTEM = `You are the assistant inside TaskGrid, a kanban/list/calendar/timeline task board.
You help the user manage their board by calling the provided functions — you can create tasks and columns, edit and move tasks, add checklist items, switch views and theme, and filter.

Guidelines:
- When the user asks you to change the board, DO IT with function calls rather than only describing it.
- You may call several functions in one turn (e.g. create three tasks), and chain calls across turns (create a task, then act on the returned id).
- Match columns and tasks by their titles from the board snapshot; prefer returned ids for follow-up actions.
- After the actions are done, reply with one short, friendly sentence summarising what you changed. Do not restate the whole board.
- If a request is ambiguous or impossible, ask a brief clarifying question instead of guessing destructively.`

export interface AssistantResult {
  text: string
  actionsTaken: number
}

/**
 * Run one user turn through Gemini with function calling, dispatching real store
 * actions as the model calls functions. Returns the model's final text plus how
 * many actions it performed. `history` is prior [user, assistant] text turns for
 * context.
 */
export async function runAssistant(
  userMessage: string,
  history: { role: 'user' | 'assistant'; text: string }[],
  ctx: ToolContext,
): Promise<AssistantResult> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const ai = new GoogleGenAI({ apiKey })

  // Gemini uses roles 'user' and 'model'. Prior turns are plain text; the newest
  // user turn carries the request plus the current board snapshot.
  const contents: Content[] = [
    ...history.map(
      (h): Content => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] }),
    ),
    {
      role: 'user',
      parts: [{ text: `${userMessage}\n\n---\nCurrent board state:\n${boardSummary(ctx.getState())}` }],
    },
  ]

  let actionsTaken = 0

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM,
        tools: [{ functionDeclarations: ASSISTANT_TOOLS }],
      },
    })

    const calls = response.functionCalls ?? []

    if (calls.length === 0) {
      return { text: response.text?.trim() || 'Done.', actionsTaken }
    }

    // Record the model's function-call turn, execute each call, then send all
    // results back together as the next user turn.
    contents.push({
      role: 'model',
      parts: calls.map((c) => ({ functionCall: c })),
    })
    contents.push({
      role: 'user',
      parts: calls.map((c) => {
        const result = executeTool(c.name ?? '', c.args, ctx)
        if (!result.startsWith('Error')) actionsTaken++
        return { functionResponse: { name: c.name, response: { result } } }
      }),
    })
  }

  return { text: 'I made several changes but stopped to avoid looping. Let me know if you need more.', actionsTaken }
}
