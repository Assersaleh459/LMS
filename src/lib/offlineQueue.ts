import { supabase } from './supabase'

interface QueuedAction {
  id:        string
  type:      'attendance' | 'grade' | 'assignment'
  payload:   object
  timestamp: number
}

const QUEUE_KEY = 'lms_offline_queue'

export class OfflineQueue {
  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const queue = this.getQueue()
    queue.push({
      ...action,
      id:        crypto.randomUUID(),
      timestamp: Date.now(),
    })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }

  getQueue(): QueuedAction[] {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  }

  async flush(): Promise<void> {
    const queue = this.getQueue()
    if (!queue.length) return

    for (const action of queue) {
      try {
        await this.executeAction(action)
      } catch (err) {
        console.warn('[offlineQueue] failed to sync action:', action.id, err)
      }
    }
    localStorage.removeItem(QUEUE_KEY)
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = action.payload as any
    switch (action.type) {
      case 'attendance':
        await supabase.from('attendance_records').upsert(p)
        break
      case 'grade':
        await supabase.from('grade_entries').insert(p)
        break
      case 'assignment':
        await supabase.from('assignment_submissions').upsert(p)
        break
    }
  }

  get pendingCount(): number {
    return this.getQueue().length
  }
}

export const offlineQueue = new OfflineQueue()

// Auto-flush when connection is restored
window.addEventListener('online', () => {
  offlineQueue.flush().catch(console.warn)
})
