function canCreate(config, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (config.adminOnlyWrite) return false;
  return !config.createRoles || config.createRoles.includes(user.role);
}

import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function canWriteRow(config, user, row) {
  if (!user || !row) return false;
  if (user.role === 'admin') return true;
  if (config.adminOnlyWrite) return false;
  if ((config.ownerFields || []).some((field) => row[field] === user.id)) return true;
  if (config.participantField && row[config.participantField]?.includes(user.id)) return true;
  if (config.conversationField) {
    const [rows] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND JSON_CONTAINS(participant_ids, JSON_QUOTE(?))',
      [row[config.conversationField], user.id]
    );
    return rows.length > 0;
  }
  return false;
}

export function createResourceController(model, config) {
  return {
    async list(req, res, next) {
      try {
        const { sort, limit, ...filters } = req.query;
        const data = await model.list({ filters, sort, limit, user: req.user });
        res.json(data);
      } catch (error) {
        next(error);
      }
    },

    async get(req, res, next) {
      try {
        const row = await model.findById(req.params.id, req.user);
        if (!row) return res.status(404).json({ message: 'Resource not found' });
        res.json(row);
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        if (!canCreate(config, req.user)) {
          return res.status(403).json({ message: 'You do not have permission to create this resource' });
        }
        const data = { ...req.body };
        if (config.userResource) {
          if (!data.email || !data.password) {
            return res.status(400).json({ message: 'Email and password are required' });
          }
          if (data.password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
          }
          data.email = data.email.trim().toLowerCase();
          data.password_hash = await bcrypt.hash(data.password, 12);
          delete data.password;
        }
        if (config.creatorField && req.user.role !== 'admin') data[config.creatorField] = req.user.id;
        if (config.participantField && !data[config.participantField]?.includes(req.user.id)) {
          return res.status(403).json({ message: 'You must be a participant in the conversation' });
        }
        if (config.conversationField) {
          const [conversations] = await pool.execute(
            'SELECT id FROM conversations WHERE id = ? AND JSON_CONTAINS(participant_ids, JSON_QUOTE(?))',
            [data[config.conversationField], req.user.id]
          );
          if (!conversations.length) {
            return res.status(403).json({ message: 'You must be a participant in the conversation' });
          }
        }
        const created = await model.create(data);
        res.status(201).json(created);
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const existing = await model.findById(req.params.id);
        if (!(await canWriteRow(config, req.user, existing))) {
          return res.status(403).json({ message: 'You do not have permission to update this resource' });
        }
        const changes = { ...req.body };
        if (config.userResource && changes.password) {
          if (changes.password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
          }
          changes.password_hash = await bcrypt.hash(changes.password, 12);
          delete changes.password;
        }
        const updated = await model.update(req.params.id, changes);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const existing = await model.findById(req.params.id);
        if (!(await canWriteRow(config, req.user, existing))) {
          return res.status(403).json({ message: 'You do not have permission to delete this resource' });
        }
        await model.remove(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  };
}
