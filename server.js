import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getAllTasks, getAllGroups, saveTasks, saveGroups, getAllUsers, createUser, updateUser, deleteUser, getUserById } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Valid values for enums
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'];
const MAX_TASK_NAME_LENGTH = 500;
const MAX_COMMENT_LENGTH = 2000;
const MAX_GROUP_NAME_LENGTH = 100;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check endpoint (for Railway/Docker healthchecks)
// Returns 200 as long as server is running (even if DB not ready yet)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbReady ? 'connected' : 'connecting'
  });
});

// Database status tracking (set during startup)
let dbReady = false;
let dbError = null;

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// ==================== Validation Functions ====================

/**
 * Validates a single task object
 * @returns {object} { valid: boolean, errors: string[] }
 */
const validateTask = (task, index, availableGroups) => {
  const errors = [];
  const prefix = `Task[${index}]`;

  // Check required fields exist
  if (typeof task !== 'object' || task === null) {
    return { valid: false, errors: [`${prefix}: Must be an object`] };
  }

  // ID validation
  if (typeof task.id !== 'string' || task.id.trim() === '') {
    errors.push(`${prefix}: 'id' must be a non-empty string`);
  }

  // Name validation
  if (typeof task.name !== 'string' || task.name.trim() === '') {
    errors.push(`${prefix}: 'name' must be a non-empty string`);
  } else if (task.name.length > MAX_TASK_NAME_LENGTH) {
    errors.push(`${prefix}: 'name' exceeds maximum length of ${MAX_TASK_NAME_LENGTH} characters`);
  }

  // Priority validation
  if (!VALID_PRIORITIES.includes(task.priority)) {
    errors.push(`${prefix}: 'priority' must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  // Color validation
  if (!VALID_COLORS.includes(task.color)) {
    errors.push(`${prefix}: 'color' must be one of: ${VALID_COLORS.join(', ')}`);
  }

  // Group validation
  if (typeof task.groupName !== 'string' || task.groupName.trim() === '') {
    errors.push(`${prefix}: 'groupName' must be a non-empty string`);
  } else if (availableGroups && !availableGroups.includes(task.groupName)) {
    errors.push(`${prefix}: 'groupName' "${task.groupName}" is not a valid group`);
  }

  // Boolean validations
  if (typeof task.completed !== 'boolean') {
    errors.push(`${prefix}: 'completed' must be a boolean`);
  }
  if (typeof task.archived !== 'boolean') {
    errors.push(`${prefix}: 'archived' must be a boolean`);
  }

  // Order validation
  if (typeof task.order !== 'number' || !Number.isInteger(task.order) || task.order < 0) {
    errors.push(`${prefix}: 'order' must be a non-negative integer`);
  }

  // Date validations (optional fields)
  if (task.createdAt !== undefined && task.createdAt !== null) {
    if (typeof task.createdAt !== 'string' || isNaN(Date.parse(task.createdAt))) {
      errors.push(`${prefix}: 'createdAt' must be a valid ISO date string`);
    }
  }
  if (task.dueDate !== undefined && task.dueDate !== null) {
    if (typeof task.dueDate !== 'string' || isNaN(Date.parse(task.dueDate))) {
      errors.push(`${prefix}: 'dueDate' must be a valid ISO date string or null`);
    }
  }

  // Comments validation
  if (task.comments !== undefined) {
    if (!Array.isArray(task.comments)) {
      errors.push(`${prefix}: 'comments' must be an array`);
    } else {
      task.comments.forEach((comment, cIndex) => {
        if (typeof comment !== 'object' || comment === null) {
          errors.push(`${prefix}.comments[${cIndex}]: Must be an object`);
        } else {
          if (typeof comment.id !== 'string' || comment.id.trim() === '') {
            errors.push(`${prefix}.comments[${cIndex}]: 'id' must be a non-empty string`);
          }
          if (typeof comment.text !== 'string' || comment.text.trim() === '') {
            errors.push(`${prefix}.comments[${cIndex}]: 'text' must be a non-empty string`);
          } else if (comment.text.length > MAX_COMMENT_LENGTH) {
            errors.push(`${prefix}.comments[${cIndex}]: 'text' exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`);
          }
          if (typeof comment.createdAt !== 'string' || isNaN(Date.parse(comment.createdAt))) {
            errors.push(`${prefix}.comments[${cIndex}]: 'createdAt' must be a valid ISO date string`);
          }
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validates an array of groups
 * @returns {object} { valid: boolean, errors: string[] }
 */
const validateGroups = (groups) => {
  const errors = [];

  if (!Array.isArray(groups)) {
    return { valid: false, errors: ['Groups must be an array'] };
  }

  if (groups.length === 0) {
    errors.push('At least one group is required');
  }

  const seen = new Set();
  groups.forEach((group, index) => {
    if (typeof group !== 'string') {
      errors.push(`Group[${index}]: Must be a string`);
    } else if (group.trim() === '') {
      errors.push(`Group[${index}]: Must be a non-empty string`);
    } else if (group.length > MAX_GROUP_NAME_LENGTH) {
      errors.push(`Group[${index}]: Exceeds maximum length of ${MAX_GROUP_NAME_LENGTH} characters`);
    } else {
      const normalized = group.trim().toLowerCase();
      if (seen.has(normalized)) {
        errors.push(`Group[${index}]: Duplicate group name "${group}"`);
      }
      seen.add(normalized);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validates the entire tasks payload
 * @returns {object} { valid: boolean, errors: string[] }
 */
const validateTasksPayload = (tasks, groups) => {
  const allErrors = [];

  // Validate groups first
  const groupValidation = validateGroups(groups);
  if (!groupValidation.valid) {
    allErrors.push(...groupValidation.errors);
  }

  // Validate each task
  if (!Array.isArray(tasks)) {
    allErrors.push('Tasks must be an array');
  } else {
    // Check for duplicate task IDs
    const taskIds = new Set();
    tasks.forEach((task, index) => {
      if (task && task.id) {
        if (taskIds.has(task.id)) {
          allErrors.push(`Task[${index}]: Duplicate task ID "${task.id}"`);
        }
        taskIds.add(task.id);
      }

      const taskValidation = validateTask(task, index, groups);
      if (!taskValidation.valid) {
        allErrors.push(...taskValidation.errors);
      }
    });
  }

  return { valid: allErrors.length === 0, errors: allErrors };
};

// ==================== API Routes ====================

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    if (name.length > 100) {
      return res.status(400).json({ error: 'User name must be 100 characters or less' });
    }
    
    const user = await createUser(name.trim());
    res.json({ success: true, user });
  } catch (error) {
    console.error('POST /api/users error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A user with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id - Update a user
app.patch('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { name, profileImage } = req.body;
    const updates = {};
    
    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'User name must be a non-empty string' });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: 'User name must be 100 characters or less' });
      }
      updates.name = name.trim();
    }
    
    // Validate profileImage if provided
    if (profileImage !== undefined) {
      if (profileImage !== null && typeof profileImage !== 'string') {
        return res.status(400).json({ error: 'Profile image must be a string URL or null' });
      }
      if (profileImage && profileImage.length > 2000) {
        return res.status(400).json({ error: 'Profile image URL must be 2000 characters or less' });
      }
      updates.profileImage = profileImage;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    const user = await updateUser(userId, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('PATCH /api/users/:id error:', error);
    
    // Handle unique constraint violation (name already exists)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A user with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Don't allow deleting the last user
    const users = await getAllUsers();
    if (users.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last user' });
    }
    
    const deleted = await deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/:id error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/tasks - Get all tasks and groups for a user
app.get('/api/tasks', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId query parameter is required' });
    }
    
    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const [tasks, groups] = await Promise.all([
      getAllTasks(userId),
      getAllGroups()
    ]);
    res.json({ tasks, groups });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Save all tasks for a user (overwrites)
app.post('/api/tasks', async (req, res) => {
  try {
    const { tasks, groups, userId } = req.body;
    
    if (!userId || isNaN(parseInt(userId, 10))) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    const parsedUserId = parseInt(userId, 10);
    
    // Verify user exists
    const user = await getUserById(parsedUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks must be an array' });
    }

    // Get existing groups if not provided
    const existingGroups = await getAllGroups();
    const groupsToUse = groups || existingGroups;

    // Validate the entire payload
    const validation = validateTasksPayload(tasks, groupsToUse);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    await saveTasks(tasks, groupsToUse, parsedUserId);
    res.json({ success: true, data: { tasks, groups: groupsToUse } });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/groups - Update groups
app.post('/api/groups', async (req, res) => {
  try {
    const { groups } = req.body;
    
    // Validate groups
    const validation = validateGroups(groups);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    await saveGroups(groups);
    res.json({ success: true, groups });
  } catch (error) {
    console.error('POST /api/groups error:', error);
    
    // Handle specific error for orphaned tasks
    if (error.message && error.message.includes('Cannot remove groups')) {
      return res.status(400).json({ 
        error: 'Cannot remove groups that have tasks assigned',
        details: [error.message]
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for all other routes in production (SPA support)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// ==================== Server Startup ====================

const startServer = async () => {
  // Start listening FIRST so health checks can respond
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  // Then initialize database (with retries)
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to database (attempt ${attempt}/${maxRetries})...`);
      await initializeDatabase();
      dbReady = true;
      dbError = null;
      console.log('Database connection established successfully');
      break;
    } catch (error) {
      dbError = error;
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s, 8s, 10s
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('All database connection attempts failed. Server running without database.');
      }
    }
  }
};

startServer();
