// Registers all models so Sequelize knows them before sync.
import './User.js';
import './Games.js';

export { default as User } from './User.js';
export { default as Game } from './Games.js';