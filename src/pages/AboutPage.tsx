import { motion } from 'framer-motion'
import { IconSparkle, IconBolt, IconTarget } from '../components/icons'
import './about-page.css'

const personas = [
  {
    icon: IconSparkle,
    name: 'Priya, the newcomer',
    tag: 'First week on the team',
    goal: 'Understand the board without a manual.',
    needs: ['Visible labels', 'Tooltips and guidance', 'Forgiving, roomy layout'],
    serves: 'Guided mode: comfortable density, tooltips on, onboarding tour.',
  },
  {
    icon: IconBolt,
    name: 'Marcus, the power user',
    tag: 'Lives in the tool all day',
    goal: 'Move through tasks as fast as possible.',
    needs: ['Keyboard shortcuts', 'High information density', 'Command palette'],
    serves: 'Power mode: compact cards, shortcut hints, palette-driven actions.',
  },
  {
    icon: IconTarget,
    name: 'Sana, the deep worker',
    tag: 'Protects focus time',
    goal: 'See only what matters right now.',
    needs: ['Fewer panels', 'Reduced motion option', 'Calm, minimal surface'],
    serves: 'Focus mode: sidebar and details hidden, distraction stripped back.',
  },
]

const heuristics = [
  {
    n: '1',
    title: 'Visibility of system status',
    body: 'Toasts confirm every save and action; drag targets highlight; a live match count reports how filters change the view.',
  },
  {
    n: '2',
    title: 'Match with the real world',
    body: 'Due dates read as “Today”, “Tomorrow”, and “3d overdue” rather than raw timestamps. Columns use plain language.',
  },
  {
    n: '3',
    title: 'User control and freedom',
    body: 'Escape closes any panel, drags can be cancelled mid-move, and the whole workspace resets to sample data on demand.',
  },
  {
    n: '4',
    title: 'Consistency and standards',
    body: 'One card component, one button system, and shared tokens keep every view speaking the same visual language.',
  },
  {
    n: '5',
    title: 'Error prevention',
    body: 'Deleting a column with tasks asks first. Empty inputs quietly cancel instead of creating blank tasks.',
  },
  {
    n: '6',
    title: 'Recognition over recall',
    body: 'The command palette lists actions so users pick rather than remember. Shortcut hints sit next to the actions they trigger.',
  },
  {
    n: '7',
    title: 'Flexibility and efficiency',
    body: 'Adaptive modes, keyboard sequences, and per-field card customisation let each person tune the interface to their pace.',
  },
  {
    n: '8',
    title: 'Aesthetic and minimalist design',
    body: 'Density and panel toggles remove what a given user does not need, so the surface never shows more than it must.',
  },
  {
    n: '9',
    title: 'Help users recover from errors',
    body: 'Clear, plain-language confirmations describe consequences before a destructive step, and cancelled drags return cards home.',
  },
  {
    n: '10',
    title: 'Help and documentation',
    body: 'A shortcuts panel, the onboarding tour, and this page document the system without pulling users out of their flow.',
  },
]

const laws = [
  {
    title: "Fitts's Law",
    body: 'Frequent targets are large and close. The primary “New” button, view switcher, and command trigger sit in a fixed top bar within easy reach. Card tap areas meet a 44px minimum in comfortable density, and touch targets never shrink below usable size on mobile.',
  },
  {
    title: "Hick's Law",
    body: 'Choices are grouped and staged to keep decision time low. The command palette filters as you type instead of showing one long menu; the sidebar splits views, modes, and settings into labelled sections; onboarding introduces one idea per step.',
  },
  {
    title: 'Cognitive load',
    body: 'Each view answers a single question about the work: what is in progress, what is due, and what comes next. That focus means users hold less in working memory. Adaptive modes hide advanced controls until they are wanted, and colour stays consistent so it encodes priority rather than decoration.',
  },
  {
    title: "Miller's rule (7 ± 2)",
    body: 'Related controls are chunked into small sets: three experience modes, three density options, four views. Nothing asks the user to scan a flat list of a dozen unrelated choices.',
  },
]

const a11y = [
  'Every interactive element is reachable and operable by keyboard, including drag-and-drop through the arrow keys.',
  'A live region announces each phase of a drag for screen-reader users: pick up, move over a column, and drop.',
  'Focus is trapped inside dialogs and returned to the trigger on close; a skip link jumps straight to the main content.',
  'A high-contrast theme, visible focus rings, and honouring the reduce-motion preference support low-vision and motion-sensitive users.',
  'Colour never carries meaning on its own. Priority pairs a dot with a text label, and due-date tone is backed by words.',
  'Controls expose the right roles and state: switches, tabs, radio groups, listbox options, and pressed states are all labelled.',
]

export function AboutPage() {
  return (
    <div className="about" role="document">
      <div className="about__inner">
        <motion.header
          className="about__hero"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="about__eyebrow">Human-Computer Interaction</span>
          <h1 className="about__title">Designing TaskGrid</h1>
          <p className="about__lede">
            TaskGrid asks a single design question: how can a productivity interface let people manage complex
            information efficiently while staying intuitive, accessible, and adaptable? These notes trace the decisions
            behind the workspace.
          </p>
        </motion.header>

        <Section id="personas" title="User personas" subtitle="Three people the workspace adapts to.">
          <div className="about__personas">
            {personas.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.article
                  key={p.name}
                  className="persona"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <span className="persona__icon">
                    <Icon size={22} />
                  </span>
                  <h3 className="persona__name">{p.name}</h3>
                  <span className="persona__tag">{p.tag}</span>
                  <p className="persona__goal">{p.goal}</p>
                  <ul className="persona__needs">
                    {p.needs.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                  <p className="persona__serves">
                    <strong>How TaskGrid serves them:</strong> {p.serves}
                  </p>
                </motion.article>
              )
            })}
          </div>
        </Section>

        <Section
          id="heuristics"
          title="Nielsen's heuristics"
          subtitle="Where each of the ten usability heuristics shows up in the build."
        >
          <div className="about__heuristics">
            {heuristics.map((h) => (
              <motion.div
                key={h.n}
                className="heuristic"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.25 }}
              >
                <span className="heuristic__num">{h.n}</span>
                <div>
                  <h3 className="heuristic__title">{h.title}</h3>
                  <p className="heuristic__body">{h.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section id="laws" title="Design laws applied" subtitle="Principles that shaped layout and interaction.">
          <div className="about__laws">
            {laws.map((l) => (
              <motion.div
                key={l.title}
                className="law card-surface"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="law__title">{l.title}</h3>
                <p className="law__body">{l.body}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section id="accessibility" title="Accessibility evaluation" subtitle="Commitments checked across the interface.">
          <ul className="about__a11y">
            {a11y.map((item, i) => (
              <motion.li
                key={i}
                className="a11y-item"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.24, delay: i * 0.03 }}
              >
                <span className="a11y-item__check" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </Section>

        <footer className="about__foot">
          <p>
            Built as a frontend-first HCI study. Tasks persist locally in the browser; there is no server and nothing
            leaves the device.
          </p>
        </footer>
      </div>
    </div>
  )
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="about__section" id={id} aria-labelledby={`${id}-h`}>
      <div className="about__section-head">
        <h2 id={`${id}-h`} className="about__section-title">
          {title}
        </h2>
        <p className="about__section-sub">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}
