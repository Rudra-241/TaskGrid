import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useStore } from '../../store/store'
import { useUi } from '../../store/ui'
import { useAllTags, useFilteredBoard } from '../../hooks/useFilteredBoard'
import { PRIORITIES, priorityMeta } from '../../lib/format'
import './filterbar.css'

export function FilterBar() {
  const { state, dispatch } = useStore()
  const ui = useUi()
  const allTags = useAllTags()
  const { matchCount, totalCount, filtersActive } = useFilteredBoard()
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Register the search input so the "/" hotkey and palette can focus it.
  const registerSearchFocus = ui.registerSearchFocus
  useEffect(() => {
    registerSearchFocus(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [registerSearchFocus])

  const { query, priorities, tags } = state.filters
  const activeCount = priorities.length + tags.length

  return (
    <div className="filterbar">
      <div className="filterbar__search">
        <SearchIcon />
        <input
          ref={inputRef}
          className="filterbar__input"
          type="search"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => dispatch({ type: 'SET_FILTER', patch: { query: e.target.value } })}
          aria-label="Search tasks"
        />
        {query && (
          <button
            className="filterbar__clear"
            aria-label="Clear search"
            onClick={() => dispatch({ type: 'SET_FILTER', patch: { query: '' } })}
          >
            ×
          </button>
        )}
      </div>

      <button
        className={clsx('btn btn--sm filterbar__toggle', { 'filterbar__toggle--on': showFilters || activeCount })}
        aria-expanded={showFilters}
        onClick={() => setShowFilters((v) => !v)}
      >
        <FilterIcon />
        Filters
        {activeCount > 0 && <span className="filterbar__badge">{activeCount}</span>}
      </button>

      {filtersActive && (
        <span className="filterbar__count" aria-live="polite">
          {matchCount} of {totalCount}
        </span>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filterbar__panel card-surface"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="group"
            aria-label="Filter options"
          >
            <div className="filterbar__section">
              <span className="filterbar__label">Priority</span>
              <div className="filterbar__chips">
                {PRIORITIES.map((p) => {
                  const on = priorities.includes(p)
                  const meta = priorityMeta[p]
                  return (
                    <button
                      key={p}
                      className={clsx('filterchip', { 'filterchip--on': on })}
                      style={on ? { background: meta.soft, borderColor: meta.color } : undefined}
                      aria-pressed={on}
                      onClick={() => dispatch({ type: 'TOGGLE_PRIORITY_FILTER', priority: p })}
                    >
                      <span className="filterchip__dot" style={{ background: meta.color }} aria-hidden="true" />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="filterbar__section">
                <span className="filterbar__label">Tags</span>
                <div className="filterbar__chips">
                  {allTags.map((tag) => {
                    const on = tags.includes(tag)
                    return (
                      <button
                        key={tag}
                        className={clsx('filterchip', { 'filterchip--on': on })}
                        aria-pressed={on}
                        onClick={() => dispatch({ type: 'TOGGLE_TAG_FILTER', tag })}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {activeCount > 0 && (
              <button className="btn btn--sm filterbar__clearall" onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}>
                Clear filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
