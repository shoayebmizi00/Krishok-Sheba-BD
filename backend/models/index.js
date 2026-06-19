import BaseModel from './BaseModel.js';
import { resources } from '../config/resources.js';

export const models = Object.fromEntries(
  Object.entries(resources).map(([name, config]) => [name, new BaseModel(config)])
);
