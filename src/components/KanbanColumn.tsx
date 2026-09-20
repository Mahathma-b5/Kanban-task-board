import { useDroppable } from '@dnd-kit/core'
import type { Task, TaskStatus } from '../types'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function KanbanColumn({
  id,
  title,
  tasks,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${
        isOver ? 'column-over' : ''
      }`}
    >
      <div className="column-header">
        <div>
          <span
            className={`status-dot status-${id}`}
          />

          <h2>{title}</h2>
        </div>

        <span className="task-count">
          {tasks.length}
        </span>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-column">
            <p>No tasks yet</p>
            <span>Drag a task here</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default KanbanColumn