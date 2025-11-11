import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Tag = sequelize.define(
    'Tag',
    {
        name: { type: DataTypes.STRING, allowNull: false, unique: true }
    },
    {
        tableName: 'tags',
        timestamps: false
    }
);

export default Tag;