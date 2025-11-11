import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Game = sequelize.define(
    'Game',
    {
        title: { type: DataTypes.STRING, allowNull: false },
        tags: { type: DataTypes.STRING },
        platform: { type: DataTypes.STRING },
        releaseDate: { type: DataTypes.DATE },
        rating: { type: DataTypes.FLOAT }
    },
    {
        tableName: 'games',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
);

export default Game;