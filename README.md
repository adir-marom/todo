# Custom Todo List

A personal todo list application built with React, shadcn/ui, and a Node.js backend with PostgreSQL storage. Designed for two users (Adir and Tzuf) with separate task lists.

## Features

### Task Management
- Create, edit, complete, and delete tasks
- Edit any task attribute (name, due date, priority, group, color)
- Delete confirmation dialog to prevent accidental deletions
- Comments on tasks
- **Undo** for destructive actions (Cmd/Ctrl+Z)

### Task Details
Each task includes:
- Name
- Creation date
- Due date with "days left" countdown
- Priority (Low, Medium, High)
- Group/Category
- Custom color indicator

### Organization
- Drag and drop reordering (in manual order mode)
- Sort by due date, priority, creation date, name, or manual order
- Filter by group, priority, and color
- Search tasks by name
- Filters and sorting apply to both active and archived views

### Multi-User Support
- Two fixed user profiles: **Adir** and **Tzuf**
- Each user has their own separate task list
- Easy profile switching with visual confirmation
- Per-user UI state (filters, sorting, active tab saved per user)

### Data Safety
- **Export**: Download tasks as JSON (full backup) or CSV (spreadsheet)
- **Import**: Restore from JSON backup with merge or replace options
- **Undo**: Revert accidental deletions within 10 seconds
- **Sync Status**: Visual indicator showing save state (Synced/Syncing/Offline/Error)
- Automatic retry with exponential backoff on network failures

### Group Management
- Add new groups from task form or management dialog
- Rename existing groups
- Delete groups (tasks are reassigned to another group)
- Groups are shared between users

### Archive
- Completed tasks automatically move to archive
- Restore button to move tasks back to active
- Sort and filter archived tasks

### UI/UX
- Contextual empty states with onboarding hints for new users
- Keyboard shortcuts (Cmd+K for quick add, Cmd+Z for undo, M for minimal view)
- Dark mode toggle
- Responsive design with mobile-optimized bottom bar
- Accessible drag-and-drop with screen reader announcements

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- PostgreSQL database
- npm or yarn

### Environment Setup

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/todolist
NODE_ENV=development
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize the database (tables are created automatically on first run)

3. Start the application:
   ```bash
   npm start
   ```

   This starts the backend server on http://localhost:3001

4. For development with hot reload:
   ```bash
   npm run start:dev
   ```

   This runs both:
   - Backend server on http://localhost:3001
   - Frontend dev server on http://localhost:5173

### Development

Run only the frontend:
```bash
npm run dev
```

Run only the backend:
```bash
npm run server
```

### Build

```bash
npm run build
```

## Data Storage

Tasks are stored in a PostgreSQL database with the following schema:

- **users**: User profiles (Adir, Tzuf)
- **tasks**: All tasks with user association
- **groups**: Shared task categories

### Backups

For production deployments, we recommend:

1. **Regular database backups**: Use `pg_dump` for PostgreSQL backups
2. **User-initiated exports**: Use the Export button to download JSON backups
3. **Retention policy**: Keep at least 7 days of database backups

Example backup command:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI primitives
- **Drag & Drop**: @dnd-kit (with accessibility support)
- **Date Handling**: date-fns
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **Testing**: Vitest, Playwright

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Quick add task |
| `Cmd/Ctrl + Z` | Undo last action |
| `M` | Toggle minimal view |
| `Escape` | Close dialogs |

## License

Private project - All rights reserved
