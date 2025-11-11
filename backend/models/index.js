// Registers all models so Sequelize knows them before sync.
import Game from './Games.js';
import Tag from './Tag.js';
import GameTag from './GameTag.js';

Game.belongsToMany(Tag, {
    through: GameTag,
    foreignKey: 'gameId',
    otherKey: 'tagId',
    as: 'tags'
});
Tag.belongsToMany(Game, {
    through: GameTag,
    foreignKey: 'tagId',
    otherKey: 'gameId',
    as: 'games'
});

export { Game, Tag, GameTag };