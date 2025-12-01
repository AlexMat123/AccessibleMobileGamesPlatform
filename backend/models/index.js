import Game from './Games.js';
import Tag from './Tag.js';
import sequelize from '../config/db.js';
import  User from './User.js';
import  Review from './Review.js';

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

User.belongsToMany(Game, {
    through: 'UserFollows',
    as: 'followedGames',
    foreignKey: 'userId',
    otherKey: 'gameId'
});

Game.belongsToMany(User, {
    through: 'UserFollows',
    as: 'followers',
    foreignKey: 'gameId',
    otherKey: 'userId'
});

Game.hasMany(Review, {
    as: 'reviews',
    foreignKey: 'gameId'
});
Review.belongsTo(Game, {
    foreignKey: 'gameId',
    as: 'game'
});


User.hasMany(Review, {
    as: 'reviews',
    foreignKey: 'userId'
});
Review.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId'
});

// Export initialized models
export { Game, Tag, User, Review, sequelize };
export default { Game, Tag, User, Review, sequelize };
