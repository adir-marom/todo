/**
 * Migration script to import existing tasks from JSON file to PostgreSQL
 * 
 * Usage:
 *   1. Set DATABASE_URL environment variable
 *   2. Run: npm run migrate
 * 
 * This script:
 *   - Reads data/tasks.json (if exists)
 *   - Creates database schema (if not exists)
 *   - Imports groups and tasks into PostgreSQL
 *   - Safe to run multiple times (uses upsert)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Schema initialization SQL
const initSchema = `
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
    comments JSONB NOT NULL DEFAULT '[]'
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);
  CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_name);
  CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(task_order);
`;

async function migrate() {
  console.log('Starting migration...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('\nTo set it:');
    console.log('  1. Create a .env file with: DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.log('  2. Or set it directly: DATABASE_URL=... npm run migrate');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    // Initialize schema
    console.log('1. Creating database schema...');
    await client.query(initSchema);
    console.log('   Schema created successfully.\n');
    
    // Check if JSON file exists
    let jsonData = { tasks: [], groups: ['Work', 'Personal', 'Shopping', 'Health'] };
    
    try {
      const fileContent = await fs.readFile(DATA_FILE, 'utf8');
      jsonData = JSON.parse(fileContent);
      console.log(`2. Found existing data file: ${DATA_FILE}`);
      console.log(`   - ${jsonData.groups?.length || 0} groups`);
      console.log(`   - ${jsonData.tasks?.length || 0} tasks\n`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('2. No existing data/tasks.json found. Using default groups.\n');
      } else {
        throw err;
      }
    }
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Import groups
    console.log('3. Importing groups...');
    const groups = jsonData.groups || ['Work', 'Personal', 'Shopping', 'Health'];
    for (const group of groups) {
      await client.query(
        'INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [group]
      );
    }
    console.log(`   Imported ${groups.length} groups.\n`);
    
    // Import tasks
    console.log('4. Importing tasks...');
    const tasks = jsonData.tasks || [];
    let imported = 0;
    let skipped = 0;
    
    for (const task of tasks) {
      try {
        await client.query(`
          INSERT INTO tasks (id, name, created_at, due_date, priority, group_name, color, completed, archived, task_order, comments)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
            comments = EXCLUDED.comments
        `, [
          task.id,
          task.name,
          task.createdAt || new Date().toISOString(),
          task.dueDate || null,
          task.priority || 'medium',
          task.groupName,
          task.color || 'blue',
          task.completed ?? false,
          task.archived ?? false,
          task.order ?? 0,
          JSON.stringify(task.comments || [])
        ]);
        imported++;
      } catch (err) {
        console.log(`   Warning: Skipped task "${task.name}" - ${err.message}`);
        skipped++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`   Imported ${imported} tasks.`);
    if (skipped > 0) {
      console.log(`   Skipped ${skipped} tasks due to errors.`);
    }
    
    // Verify migration
    console.log('\n5. Verifying migration...');
    const groupCount = await client.query('SELECT COUNT(*) FROM groups');
    const taskCount = await client.query('SELECT COUNT(*) FROM tasks');
    console.log(`   Database now has:`);
    console.log(`   - ${groupCount.rows[0].count} groups`);
    console.log(`   - ${taskCount.rows[0].count} tasks`);
    
    console.log('\n✓ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
