# NextBoard — Kanban Task Board

A modern full-stack Kanban task management application built with **React, TypeScript, Supabase, and Vite**.

NextBoard helps users organize tasks across different stages of a workflow with drag-and-drop interactions, task priorities, due dates, search, and filtering.

🌐 **Live Demo:** https://kanban-task-board-alpha-ruddy.vercel.app

---

## ✨ Features

- Create, edit, and delete tasks
- Drag and drop tasks between workflow stages
- Four Kanban columns:
  - To Do
  - In Progress
  - In Review
  - Done
- Task descriptions
- Priority levels — Low, Normal, and High
- Due dates with smart indicators
  - Overdue
  - Due today
  - Due soon
- Search tasks by title or description
- Filter tasks by priority
- Total and completed task statistics
- Persistent task data using Supabase
- Automatic guest authentication
- Row Level Security (RLS) for user data isolation
- Loading, error, empty, and no-results states
- Responsive and polished interface

---

## 🛠️ Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend & Database**
- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security (RLS)

**Libraries**
- dnd-kit — drag and drop
- Lucide React — icons

**Deployment & Version Control**
- Vercel
- Git
- GitHub

---

## 🔐 Authentication & Security

NextBoard automatically creates an anonymous guest account using **Supabase Auth**.

Every task is associated with the authenticated user's `user_id`.

Supabase **Row Level Security (RLS)** policies ensure that users can only:

- View their own tasks
- Create tasks for their own account
- Update their own tasks
- Delete their own tasks

The frontend uses the Supabase **publishable key** only. Secret/service-role keys are never exposed in the client or committed to GitHub.

---

## 🗄️ Database Structure

The main `tasks` table contains:

| Field | Description |
|---|---|
| `id` | Unique task UUID |
| `title` | Task title |
| `description` | Optional task description |
| `status` | Current Kanban stage |
| `priority` | Low, Normal, or High |
| `due_date` | Optional due date |
| `user_id` | Owner of the task |
| `created_at` | Task creation timestamp |

Task status values:

`todo` → `in_progress` → `in_review` → `done`

---

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Mahathma-b5/Kanban-task-board.git
cd Kanban-task-board
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit `.env.local` or any secret keys.

### 4. Start the development server

```bash
npm run dev
```

### 5. Create a production build

```bash
npm run build
```

---

## 🧠 Design Decisions

The interface was designed to keep task management simple and visually clear.

Each workflow stage has its own column and task count, while priority badges and due-date indicators make important tasks easy to identify.

A dedicated drag handle helps prevent accidental dragging while users are editing or deleting tasks.

Supabase was used directly from the frontend because it provides authentication, PostgreSQL persistence, and database-level authorization through RLS without requiring an unnecessary separate API server for this project.

---

## 🔮 Future Improvements

Possible future additions include:

- Team workspaces
- Task assignees
- Comments
- Activity history
- Labels and tags
- Advanced filtering
- Custom task ordering
- Real-time collaboration
- Automated testing
- Additional accessibility improvements

---

## 👨‍💻 Author

**Sai Mahathma Reddy Bokka**  
Master's in Computer Science — New Jersey Institute of Technology

Built as a Software Development Internship Assessment.
