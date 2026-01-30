# Custom Todo List

A local todo list application built with React, shadcn/ui, and a Node.js backend for JSON file storage.

## Features

- **Task Management**: Create, edit, complete, and delete tasks
  - Edit any task attribute (name, due date, priority, group, color)
  - Delete confirmation dialog to prevent accidental deletions
  - Comments on tasks
- **Task Details**: Each task includes:
  - Name
  - Creation date
  - Due date with "days left" countdown
  - Priority (Low, Medium, High)
  - Group/Category
  - Custom color
- **Organization**:
  - Drag and drop reordering (in manual order mode)
  - Sort by due date, priority, creation date, name, or manual order
  - Filter by group, priority, and color
  - Search tasks by name
  - Filters and sorting apply to both active and archived views
- **Group Management**:
  - Add new groups from task form or management dialog
  - Rename existing groups
  - Delete groups (tasks are reassigned to another group)
- **Archive**: Completed tasks automatically move to archive
  - Restore button to move tasks back to active
  - Sort and filter archived tasks
- **UI/UX Improvements**:
  - Contextual empty states ("No tasks yet" vs "No matches")
  - Clear filters button when no results match
  - Persistent UI state (filters, sorting, active tab saved across sessions)
- **Dark Mode**: Toggle between light and dark themes
- **Local Storage**: All data saved to a local JSON file

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application (runs both backend and frontend):
   ```bash
   npm start
   ```

   This will start:
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

Tasks are stored in `data/tasks.json` in the project root. This file is created automatically when you first run the application.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Date Handling**: date-fns
- **Backend**: Express.js
- **Storage**: Local JSON file
