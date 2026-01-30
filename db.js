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
    
    // Check if groups table is empty and seed defaults
    const result = await client.query('SELECT COUNT(*) FROM groups');
    if (parseInt(result.rows[0].count) === 0) {
      for (const group of DEFAULT_GROUPS) {
        await client.query('INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [group]);
      }
      console.log('Database initialized with default groups');
    }
    
    // Migration: Create "Adir" user and assign existing tasks without user_id
    const adir = await client.query(`
      INSERT INTO users (name) VALUES ('Adir') 
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
      RETURNING id
    `);
    const adirId = adir.rows[0].id;
    
    // Assign orphaned tasks (tasks without a user_id) to Adir
    const updated = await client.query(`
      UPDATE tasks SET user_id = $1 WHERE user_id IS NULL
    `, [adirId]);
    
    if (updated.rowCount > 0) {
      console.log(`Migrated ${updated.rowCount} tasks to user "Adir"`);
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
  const result = await pool.query('SELECT id, name, created_at as "createdAt" FROM users ORDER BY id ASC');
  return result.rows;
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export const getUserById = async (userId) => {
  const result = await pool.query('SELECT id, name, created_at as "createdAt" FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
};

/**
 * Create a new user
 * @param {string} name - User name
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (name) => {
  const result = await pool.query(
    'INSERT INTO users (name) VALUES ($1) RETURNING id, name, created_at as "createdAt"',
    [name]
  );
  return result.rows[0];
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
 * Get all tasks for a specific user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of task objects
 */
export const getAllTasks = async (userId) => {
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
      user_id as "userId"
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
        INSERT INTO tasks (id, name, created_at, due_date, priority, group_name, color, completed, archived, task_order, comments, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          user_id = EXCLUDED.user_id
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
        userId
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
