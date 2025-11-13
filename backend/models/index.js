import Game from './Games.js';
import Tag from './Tag.js';

// Define many\-to\-many associations after models are initialized
Game.belongsToMany(Tag, {
    through: 'GameTags',
    as: 'tags',
    foreignKey: 'gameId',
    otherKey: 'tagId'
});

Tag.belongsToMany(Game, {
    through: 'GameTags',
    as: 'games',
    foreignKey: 'tagId',
    otherKey: 'gameId'
});

// Export initialized models
export { Game, Tag };
export default { Game, Tag };
