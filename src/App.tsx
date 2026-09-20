import { useEffect, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Filter, Plus, Search } from 'lucide-react'
import { supabase } from './lib/supabase'
import KanbanColumn from './components/KanbanColumn'
import type { Task, TaskPriority, TaskStatus } from './types'
import './App.css'

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
]

type PriorityFilter = 'all' | TaskPriority

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    initializeApp()
  }, [])

  async function initializeApp() {
    try {
      setLoading(true)
      setError('')

      let {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        const { data, error: authError } =
          await supabase.auth.signInAnonymously()

        if (authError) {
          throw new Error(authError.message)
        }

        session = data.session
      }

      if (!session) {
        throw new Error('Unable to create guest session.')
      }

      await fetchTasks()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function fetchTasks() {
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      throw new Error(fetchError.message)
    }

    setTasks((data ?? []) as Task[])
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setPriority('normal')
    setDueDate('')
  }

  function openNewTaskForm() {
    setEditingTask(null)
    resetForm()
    setShowForm(true)
  }

  function closeTaskForm() {
    setShowForm(false)
    setEditingTask(null)
    resetForm()
  }

  function startEdit(task: Task) {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setShowForm(true)
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) return

    try {
      setError('')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Guest session not found.')
      }

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          status: 'todo',
          priority,
          due_date: dueDate || null,
          user_id: session.user.id,
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      setTasks((current) => [data as Task, ...current])
      closeTaskForm()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create task.',
      )
    }
  }

  async function updateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingTask || !title.trim()) return

    try {
      setError('')

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate || null,
        })
        .eq('id', editingTask.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === editingTask.id ? (data as Task) : task,
        ),
      )

      closeTaskForm()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update task.',
      )
    }
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    )

    if (!confirmed) return

    try {
      setError('')

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setTasks((current) =>
        current.filter((item) => item.id !== task.id),
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete task.',
      )
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const taskId = String(active.id)
    const newStatus = String(over.id) as TaskStatus

    if (!columns.some((column) => column.id === newStatus)) {
      return
    }

    const task = tasks.find((item) => item.id === taskId)

    if (!task || task.status === newStatus) {
      return
    }

    const previousStatus = task.status

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, status: newStatus }
          : item,
      ),
    )

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (updateError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === taskId
            ? { ...item, status: previousStatus }
            : item,
        ),
      )

      setError(updateError.message)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase()

    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.description ?? '').toLowerCase().includes(query)

    const matchesPriority =
      priorityFilter === 'all' ||
      task.priority === priorityFilter

    return matchesSearch && matchesPriority
  })

  const completedTasks = tasks.filter(
    (task) => task.status === 'done',
  ).length

  if (loading) {
    return (
      <div className="state-screen">
        <div className="loader" />
        <h2>Loading your workspace...</h2>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">
            <div className="brand-mark">N</div>
            <span>NextBoard</span>
          </div>

          <p className="subtitle">
            Plan, prioritize, and move work forward.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openNewTaskForm}
        >
          <Plus size={18} />
          New task
        </button>
      </header>

      <main>
        <div className="board-heading">
          <div>
            <p className="eyebrow">MY WORKSPACE</p>
            <h1>Product Sprint</h1>

            <p>
              Organize your tasks across each stage of the workflow.
            </p>
          </div>

          <div className="stats">
            <div>
              <strong>{tasks.length}</strong>
              <span>Total</span>
            </div>

            <div>
              <strong>{completedTasks}</strong>
              <span>Completed</span>
            </div>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={16} />

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as PriorityFilter,
                )
              }
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="normal">Normal priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>

          {(search || priorityFilter !== 'all') && (
            <button
              type="button"
              className="clear-filter-button"
              onClick={() => {
                setSearch('')
                setPriorityFilter('all')
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <strong>Something went wrong.</strong>
            <span>{error}</span>
          </div>
        )}

        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <div className="board">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={filteredTasks.filter(
                  (task) => task.status === column.id,
                )}
                onEdit={startEdit}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </DndContext>

        {tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="no-results">
            <Search size={22} />
            <strong>No matching tasks</strong>
            <span>Try changing your search or priority filter.</span>
          </div>
        )}
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={closeTaskForm}
        >
          <div
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingTask ? 'EDIT TASK' : 'NEW TASK'}
                </p>

                <h2>
                  {editingTask ? 'Edit task' : 'Create a task'}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeTaskForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={editingTask ? updateTask : createTask}
            >
              <label>
                Task title

                <input
                  type="text"
                  placeholder="e.g. Design dashboard"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  autoFocus
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  placeholder="Add a short description..."
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                />
              </label>

              <div className="form-row">
                <label>
                  Priority

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value as TaskPriority,
                      )
                    }
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label>
                  Due date

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeTaskForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingTask
                    ? 'Save changes'
                    : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App