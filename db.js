import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
dotenv.config();

const { Pool } = pg;

// Create connection pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Schema initialization SQL
const initSchema = `
  -- Create users table
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    profile_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Create groups table
  CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
  );

  -- Create tasks table
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    group_name VARCHAR(100) NOT NULL REFERENCES groups(name) ON UPDATE CASCADE,
    color VARCHAR(20) NOT NULL CHECK (color IN ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray')),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    task_order INTEGER NOT NULL DEFAULT 0,
    comments JSONB NOT NULL DEFAULT '[]',
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  );

  -- Create index for common queries
  CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);
  CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_name);
  CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(task_order);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
`;

// Default groups to insert if table is empty
const DEFAULT_GROUPS = ['Work', 'Personal', 'Shopping', 'Health'];

/**
 * Initialize database schema
 * Creates tables if they don't exist and seeds default groups
 */
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create schema
    await client.query(initSchema);
    
    // Migration: Add user_id column to existing tasks table if it doesn't exist
    const columnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'user_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      // Add user_id column if it doesn't exist
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('Added user_id column to tasks table');
    }
    
    // Migration: Add profile_image column to existing users table if it doesn't exist
    const profileImageCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_image'
    `);
    
    if (profileImageCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT
      `);
      console.log('Added profile_image column to users table');
    }
    
    // Migration: Add recurrence_type column to tasks table if it doesn't exist
    const recurrenceCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'recurrence_type'
    `);
    
    if (recurrenceCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) DEFAULT NULL
      `);
      console.log('Added recurrence_type column to tasks table');
    }
    
    // Migration: Add last_completed_at column to tasks table if it doesn't exist
    const lastCompletedCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'last_completed_at'
    `);
    
    if (lastCompletedCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ DEFAULT NULL
      `);
      console.log('Added last_completed_at column to tasks table');
    }
    
    // Check if groups table is empty and seed defaults
    const result = await client.query('SELECT COUNT(*) FROM groups');
    if (parseInt(result.rows[0].count) === 0) {
      for (const group of DEFAULT_GROUPS) {
        await client.query('INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [group]);
      }
      console.log('Database initialized with default groups');
    }
    
    // Migration: Create default users "Adir" and "Tzuf"
    const usersToCreate = [
      { name: 'Adir', image: '/adir.png' },
      { name: 'Tzuf', image: '/tzuf.png' }
    ];

    let adirId = null;
    for (const user of usersToCreate) {
      const res = await client.query(`
        INSERT INTO users (name, profile_image) VALUES ($1, $2) 
        ON CONFLICT (name) DO UPDATE SET 
          name = EXCLUDED.name,
          profile_image = EXCLUDED.profile_image
        RETURNING id
      `, [user.name, user.image]);
      
      if (user.name === 'Adir') adirId = res.rows[0].id;
    }
    
    // Assign orphaned tasks (tasks without a user_id) to Adir
    if (adirId) {
      const updated = await client.query(`
        UPDATE tasks SET user_id = $1 WHERE user_id IS NULL
      `, [adirId]);
      
      if (updated.rowCount > 0) {
        console.log(`Migrated ${updated.rowCount} tasks to user "Adir"`);
      }
    }
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async () => {
  const result = await pool.query('SELECT id, name, profile_image as "profileImage", created_at as "createdAt" FROM users ORDER BY id ASC');
  return result.rows;
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export const getUserById = async (userId) => {
  const result = await pool.query('SELECT id, name, profile_image as "profileImage", created_at as "createdAt" FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
};

/**
 * Create a new user
 * @param {string} name - User name
 * @param {string|null} profileImage - Optional profile image URL
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (name, profileImage = null) => {
  const result = await pool.query(
    'INSERT INTO users (name, profile_image) VALUES ($1, $2) RETURNING id, name, profile_image as "profileImage", created_at as "createdAt"',
    [name, profileImage]
  );
  return result.rows[0];
};

/**
 * Update a user
 * @param {number} userId - User ID
 * @param {object} updates - Object containing updates (name, profileImage)
 * @returns {Promise<Object|null>} Updated user object or null if not found
 */
export const updateUser = async (userId, updates) => {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;
  
  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex}`);
    values.push(updates.name);
    paramIndex++;
  }
  
  if (updates.profileImage !== undefined) {
    setClauses.push(`profile_image = $${paramIndex}`);
    values.push(updates.profileImage);
    paramIndex++;
  }
  
  if (setClauses.length === 0) {
    // No updates provided, just return the current user
    return getUserById(userId);
  }
  
  values.push(userId);
  
  const result = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, profile_image as "profileImage", created_at as "createdAt"`,
    values
  );
  return result.rows[0] || null;
};

/**
 * Delete a user and all their tasks
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteUser = async (userId) => {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return result.rowCount > 0;
};

/**
 * Check and reset recurring tasks that are due for reset.
 * Weekly tasks reset every Sunday at 00:00 (based on server time).
 * If the task was completed/archived before the most recent Sunday, it gets reset.
 * @param {number} userId - User ID
 */
export const checkAndResetRecurringTasks = async (userId) => {
  // Calculate the most recent Sunday at 00:00:00
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  lastSunday.setHours(0, 0, 0, 0);
  
  const result = await pool.query(`
    UPDATE tasks
    SET completed = false, archived = false
    WHERE user_id = $1
      AND recurrence_type = 'weekly'
      AND (completed = true OR archived = true)
      AND (last_completed_at < $2 OR last_completed_at IS NULL)
  `, [userId, lastSunday.toISOString()]);
  
  if (result.rowCount > 0) {
    console.log(`Reset ${result.rowCount} recurring task(s) for user ${userId}`);
  }
};

/**
 * Get all tasks for a specific user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of task objects
 */
export const getAllTasks = async (userId) => {
  // Reset any recurring tasks that are due before fetching
  await checkAndResetRecurringTasks(userId);
  
  const result = await pool.query(`
    SELECT 
      id,
      name,
      created_at as "createdAt",
      due_date as "dueDate",
      priority,
      group_name as "groupName",
      color,
      completed,
      archived,
      task_order as "order",
      comments,
      user_id as "userId",
      recurrence_type as "recurrence",
      last_completed_at as "lastCompletedAt"
    FROM tasks
    WHERE user_id = $1
    ORDER BY task_order ASC
  `, [userId]);
  return result.rows;
};

/**
 * Get all groups
 * @returns {Promise<Array>} Array of group names
 */
export const getAllGroups = async () => {
  const result = await pool.query('SELECT name FROM groups ORDER BY id ASC');
  return result.rows.map(row => row.name);
};

/**
 * Save all tasks for a specific user (replaces existing data for that user)
 * @param {Array} tasks - Array of task objects
 * @param {Array} groups - Array of group names
 * @param {number} userId - User ID
 */
export const saveTasks = async (tasks, groups, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get existing groups to preserve ones that have tasks
    const existingGroups = await client.query('SELECT name FROM groups');
    const existingGroupNames = new Set(existingGroups.rows.map(r => r.name));
    
    // Add any new groups
    for (const group of groups) {
      if (!existingGroupNames.has(group)) {
        await client.query('INSERT INTO groups (name) VALUES ($1)', [group]);
      }
    }
    
    // Delete tasks that are no longer in the list (only for this user)
    const taskIds = tasks.map(t => t.id);
    if (taskIds.length > 0) {
      await client.query('DELETE FROM tasks WHERE user_id = $1 AND id != ALL($2::uuid[])', [userId, taskIds]);
    } else {
      await client.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
    }
    
    // Upsert each task
    for (const task of tasks) {
      await client.query(`
        INSERT INTO tasks (id, name, created_at, due_date, priority, group_name, color, completed, archived, task_order, comments, user_id, recurrence_type, last_completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          created_at = EXCLUDED.created_at,
          due_date = EXCLUDED.due_date,
          priority = EXCLUDED.priority,
          group_name = EXCLUDED.group_name,
          color = EXCLUDED.color,
          completed = EXCLUDED.completed,
          archived = EXCLUDED.archived,
          task_order = EXCLUDED.task_order,
          comments = EXCLUDED.comments,
          user_id = EXCLUDED.user_id,
          recurrence_type = EXCLUDED.recurrence_type,
          last_completed_at = EXCLUDED.last_completed_at
      `, [
        task.id,
        task.name,
        task.createdAt,
        task.dueDate || null,
        task.priority,
        task.groupName,
        task.color,
        task.completed,
        task.archived,
        task.order,
        JSON.stringify(task.comments || []),
        userId,
        task.recurrence || null,
        task.lastCompletedAt || null
      ]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update groups list
 * @param {Array} groups - Array of group names
 */
export const saveGroups = async (groups) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get groups that have tasks assigned
    const usedGroups = await client.query('SELECT DISTINCT group_name FROM tasks');
    const usedGroupNames = new Set(usedGroups.rows.map(r => r.group_name));
    
    // Check if any used groups are being removed
    const existingGroups = await client.query('SELECT name FROM groups');
    const existingGroupNames = existingGroups.rows.map(r => r.name);
    const groupsToRemove = existingGroupNames.filter(g => !groups.includes(g));
    const orphanedGroups = groupsToRemove.filter(g => usedGroupNames.has(g));
    
    if (orphanedGroups.length > 0) {
      throw new Error(`Cannot remove groups that have tasks assigned: ${orphanedGroups.join(', ')}`);
    }
    
    // Remove groups that are no longer needed
    for (const group of groupsToRemove) {
      await client.query('DELETE FROM groups WHERE name = $1', [group]);
    }
    
    // Add new groups
    for (const group of groups) {
      await client.query('INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [group]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close the database pool (for graceful shutdown)
 */
export const closePool = async () => {
  await pool.end();
};

export default pool;
