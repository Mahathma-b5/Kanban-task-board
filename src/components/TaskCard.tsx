import { useDraggable } from '@dnd-kit/core'
import {
  AlertCircle,
  Calendar,
  GripVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function getDueDateInfo(task: Task) {
  if (!task.due_date || task.status === 'done') {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${task.due_date}T00:00:00`)

  const difference =
    dueDate.getTime() - today.getTime()

  const daysRemaining = Math.round(
    difference / (1000 * 60 * 60 * 24),
  )

  if (daysRemaining < 0) {
    return {
      className: 'due-overdue',
      label: 'Overdue',
    }
  }

  if (daysRemaining === 0) {
    return {
      className: 'due-today',
      label: 'Due today',
    }
  }

  if (daysRemaining <= 3) {
    return {
      className: 'due-soon',
      label: `Due in ${daysRemaining} ${
        daysRemaining === 1 ? 'day' : 'days'
      }`,
    }
  }

  return null
}

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function TaskCard({
  task,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      task,
    },
  })

  const dueDateInfo = getDueDateInfo(task)

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
      }
    : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="task-card"
    >
      <div className="task-card-header">
        <span
          className={`priority priority-${task.priority}`}
        >
          {task.priority}
        </span>

        <div className="card-actions">
          <button
            type="button"
            className="icon-button"
            title="Edit task"
            aria-label={`Edit ${task.title}`}
            onClick={() => onEdit(task)}
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            className="icon-button delete-icon"
            title="Delete task"
            aria-label={`Delete ${task.title}`}
            onClick={() => onDelete(task)}
          >
            <Trash2 size={14} />
          </button>

          <button
            type="button"
            className="drag-handle"
            title="Drag task"
            aria-label={`Drag ${task.title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical size={17} />
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>

      {task.description && (
        <p className="task-description">
          {task.description}
        </p>
      )}

      {task.due_date && (
        <div className="due-date-section">
          <div className="due-date">
            <Calendar size={14} />
            <span>{formatDueDate(task.due_date)}</span>
          </div>

          {dueDateInfo && (
            <span
              className={`due-indicator ${dueDateInfo.className}`}
            >
              <AlertCircle size={12} />
              {dueDateInfo.label}
            </span>
          )}
        </div>
      )}
    </article>
  )
}

export default TaskCard