import crypto from 'node:crypto';
import { pool } from '../config/db.js';

const sortableAliases = { created_date: 'created_at', updated_date: 'updated_at' };

function parseRow(row, config) {
  const result = { ...row, created_date: row.created_at, updated_date: row.updated_at };
  for (const field of config.json || []) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch {
        result[field] = [];
      }
    }
  }
  delete result.password_hash;
  delete result.reset_password_token;
  delete result.reset_password_expires;
  return result;
}

export default class BaseModel {
  constructor(config) {
    this.config = config;
  }

  allowed(field) {
    return field === 'id' || this.config.columns.includes(field);
  }

  normalizeData(data) {
    const normalized = {};
    for (const [field, value] of Object.entries(data)) {
      if (!this.allowed(field) || ['id', 'created_at', 'updated_at'].includes(field)) continue;
      normalized[field] = (this.config.json || []).includes(field) ? JSON.stringify(value ?? []) : value;
    }
    return normalized;
  }

  scopeFor(user) {
    if (!user || user.role === 'admin' || this.config.publicRead) return { sql: '', values: [] };
    const clauses = (this.config.ownerFields || []).map((field) => `\`${field}\` = ?`);
    const values = (this.config.ownerFields || []).map(() => user.id);
    if (this.config.participantField) {
      clauses.push(`JSON_CONTAINS(\`${this.config.participantField}\`, JSON_QUOTE(?))`);
      values.push(user.id);
    }
    if (this.config.conversationField) {
      clauses.push(`\`${this.config.conversationField}\` IN (
        SELECT id FROM conversations WHERE JSON_CONTAINS(participant_ids, JSON_QUOTE(?))
      )`);
      values.push(user.id);
    }
    if (!clauses.length) return { sql: ' AND 1 = 0', values: [] };
    return { sql: ` AND (${clauses.join(' OR ')})`, values };
  }

  async list({ filters = {}, sort = '-created_date', limit = 100, page = 1, user = null } = {}) {
    const conditions = [];
    const values = [];
    for (const [field, value] of Object.entries(filters)) {
      const mapped = sortableAliases[field] || field;
      if (!this.allowed(mapped)) continue;
      conditions.push(`\`${mapped}\` = ?`);
      values.push(value);
    }
    const scope = this.scopeFor(user);
    let where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : 'WHERE 1 = 1';
    where += scope.sql;
    values.push(...scope.values);

    const descending = sort.startsWith('-');
    const requestedSort = sort.replace(/^-/, '');
    const sortField = sortableAliases[requestedSort] || requestedSort;
    const safeSort = this.allowed(sortField) ? sortField : 'created_at';
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;
    const [rows] = await pool.execute(
      `SELECT * FROM \`${this.config.table}\` ${where} ORDER BY \`${safeSort}\` ${descending ? 'DESC' : 'ASC'} LIMIT ${safeLimit} OFFSET ${offset}`,
      values
    );
    return rows.map((row) => parseRow(row, this.config));
  }

  async findById(id, user = null) {
    const rows = await this.list({ filters: { id }, limit: 1, user });
    return rows[0] || null;
  }

  async create(data) {
    const normalized = this.normalizeData(data);
    const id = crypto.randomUUID();
    const fields = ['id', ...Object.keys(normalized)];
    const values = [id, ...Object.values(normalized)];
    const placeholders = fields.map(() => '?').join(', ');
    await pool.execute(
      `INSERT INTO \`${this.config.table}\` (${fields.map((field) => `\`${field}\``).join(', ')}) VALUES (${placeholders})`,
      values
    );
    return this.findById(id);
  }

  async update(id, data) {
    const normalized = this.normalizeData(data);
    const fields = Object.keys(normalized);
    if (!fields.length) return this.findById(id);
    const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');
    await pool.execute(
      `UPDATE \`${this.config.table}\` SET ${assignments} WHERE id = ?`,
      [...Object.values(normalized), id]
    );
    return this.findById(id);
  }

  async remove(id) {
    const [result] = await pool.execute(`DELETE FROM \`${this.config.table}\` WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}
