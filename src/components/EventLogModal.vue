<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import type { Event } from '@/utils/event'
import { buildLogRows, type LogRow } from '@/utils/event-log'

interface Props {
  events: Event[]
  handleClose: () => void
}

const props = defineProps<Props>()

const rows = computed(() => buildLogRows(props.events))

// red/orange/yellow/green/blue/purple starting at R1/T1, so indexed by n % 6
// the cycle reads [purple, red, orange, yellow, green, blue]. R0/T0 (run
// setup) sits outside the cycle in grey.
const CYCLE_COLORS = ['#7d3c98', '#c0392b', '#d35400', '#b7950b', '#1e8449', '#2471a3']
const SETUP_GREY = '#888'

function cycleColor(n: number): string {
  return n === 0 ? SETUP_GREY : CYCLE_COLORS[n % 6]
}

const roundKey = (row: LogRow) => `r${row.round}`
const turnKey = (row: LogRow) => `r${row.round}t${row.turn}`

// Past rounds and turns start collapsed; only the current round and current
// turn (where the latest event landed) open by default.
function defaultCollapsed(allRows: LogRow[]): Set<string> {
  const keys = new Set<string>()
  const latest = allRows[allRows.length - 1]
  if (!latest) return keys

  for (const row of allRows) {
    if (row.kind === 'round-start' && row.round !== latest.round) {
      keys.add(roundKey(row))
    } else if (
      row.kind === 'turn-start' &&
      !(row.round === latest.round && row.turn === latest.turn)
    ) {
      keys.add(turnKey(row))
    }
  }
  return keys
}

const collapsed = ref(defaultCollapsed(rows.value))

function toggleKey(row: LogRow): string {
  return row.kind === 'round-start' ? roundKey(row) : turnKey(row)
}

function toggle(row: LogRow) {
  const key = toggleKey(row)
  const next = new Set(collapsed.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  collapsed.value = next
}

// A round-start row is always visible; a turn-start row hides with its round;
// any other row hides with its round or its turn.
function isVisible(row: LogRow): boolean {
  if (row.kind === 'round-start') return true
  if (collapsed.value.has(roundKey(row))) return false
  if (row.kind === 'turn-start') return true
  return !collapsed.value.has(turnKey(row))
}

// How many events a collapsed toggle is hiding (condensed rows count as
// their full event count)
function hiddenCount(row: LogRow): number {
  const hidden =
    row.kind === 'round-start'
      ? rows.value.filter((r) => r.round === row.round && r !== row)
      : rows.value.filter((r) => r.kind === 'event' && r.round === row.round && r.turn === row.turn)
  return hidden.reduce((sum, r) => sum + r.count, 0)
}

const visibleRows = computed(() =>
  rows.value.map((row, index) => ({ row, index })).filter(({ row }) => isVisible(row)),
)

// Most recent events are at the bottom, so start scrolled there
const listRef = useTemplateRef('listRef')
onMounted(() => {
  listRef.value?.scrollTo(0, listRef.value.scrollHeight)
})
</script>

<template>
  <div class="modal-overlay" data-testid="event-log-modal" @click="props.handleClose()">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Event Log</h2>
        <button class="close-button" data-testid="event-log-close" @click="props.handleClose()">
          &times;
        </button>
      </div>
      <div v-if="rows.length === 0" class="event-log-empty">No events yet.</div>
      <div v-else ref="listRef" class="event-log-list">
        <div
          v-for="{ row, index } in visibleRows"
          :key="index"
          class="event-log-entry"
          data-testid="event-log-entry"
        >
          <span class="entry-stamp">
            <span :style="{ color: cycleColor(row.round) }">R{{ row.round }}</span>
            <span :style="{ color: cycleColor(row.turn) }">T{{ row.turn }}</span>
          </span>
          <span class="entry-text">{{ row.text }}</span>
          <span v-if="row.count > 1" class="entry-count">×{{ row.count }}</span>
          <button
            v-if="row.kind !== 'event'"
            class="entry-toggle"
            data-testid="event-log-toggle"
            @click="toggle(row)"
          >
            <span v-if="collapsed.has(toggleKey(row))" class="entry-hidden-count">
              {{ hiddenCount(row) }}
            </span>
            {{ collapsed.has(toggleKey(row)) ? '+' : '−' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 420px;
  max-width: 90vw;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.event-log-empty {
  color: #666;
  text-align: center;
  padding: 1em 0;
}

.event-log-list {
  overflow-y: auto;
  min-height: 0;
}

.event-log-entry {
  display: flex;
  align-items: baseline;
  gap: 0.6em;
  padding: 0.15em 0;
  border-bottom: 1px solid #f6f6f6;
  color: #333;
  font-size: 14px;
}

.entry-stamp {
  display: inline-flex;
  gap: 0.4em;
  flex-shrink: 0;
  width: 4em;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.entry-toggle {
  margin-left: auto;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  background: none;
  border: none;
  padding: 0 0.25em;
  color: #aaa;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  align-self: center;
}

.entry-toggle:hover {
  color: #666;
}

.entry-hidden-count {
  font-size: 12px;
}

.entry-text {
  min-width: 0;
}

.entry-count {
  padding: 0 0.4em;
  border-radius: 8px;
  background-color: #eee;
  color: #666;
  font-size: 12px;
  font-weight: 600;
}
</style>
