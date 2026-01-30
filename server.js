import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// Valid values for enums
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'];
const MAX_TASK_NAME_LENGTH = 500;
const MAX_COMMENT_LENGTH = 2000;
const MAX_GROUP_NAME_LENGTH = 100;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Ensure data directory exists (sync on startup is fine)
const dataDir = path.join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize tasks.json if it doesn't exist (sync on startup is fine)
if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({ tasks: [], groups: ['Work', 'Personal', 'Shopping', 'Health'] }, null, 2));
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

// ==================== Async File I/O ====================

// Helper function to read tasks (async)
const readTasks = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tasks:', error);
    return { tasks: [], groups: ['Work', 'Personal', 'Shopping', 'Health'] };
  }
};

// Helper function to write tasks (async)
const writeTasks = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing tasks:', error);
    return false;
  }
};

// GET /api/tasks - Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const data = await readTasks();
    res.json(data);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Save all tasks (overwrites)
app.post('/api/tasks', async (req, res) => {
  try {
    const { tasks, groups } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks must be an array' });
    }

    // Get existing groups if not provided
    const existingData = await readTasks();
    const groupsToUse = groups || existingData.groups;

    // Validate the entire payload
    const validation = validateTasksPayload(tasks, groupsToUse);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const data = { 
      tasks, 
      groups: groupsToUse 
    };
    
    if (await writeTasks(data)) {
      res.json({ success: true, data });
    } else {
      res.status(500).json({ error: 'Failed to save tasks' });
    }
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

    const data = await readTasks();
    
    // Check if any tasks reference groups that are being removed
    const removedGroups = data.groups.filter(g => !groups.includes(g));
    const orphanedTasks = data.tasks.filter(t => removedGroups.includes(t.groupName));
    
    if (orphanedTasks.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot remove groups that have tasks assigned',
        details: [`${orphanedTasks.length} task(s) are assigned to groups being removed: ${removedGroups.join(', ')}`]
      });
    }

    data.groups = groups;
    
    if (await writeTasks(data)) {
      res.json({ success: true, groups });
    } else {
      res.status(500).json({ error: 'Failed to save groups' });
    }
  } catch (error) {
    console.error('POST /api/groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
