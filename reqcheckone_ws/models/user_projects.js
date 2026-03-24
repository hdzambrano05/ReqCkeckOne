const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const attributes = {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        key: "id",
        model: "users_model"
      }
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        key: "id",
        model: "projects_model"
      }
    },
    role: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      defaultValue: "member",
      field: "role"
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: "joined_at"
    }
  };

  const options = {
    tableName: "user_projects",
    schema: "public",
    timestamps: false,   // 👈 evitamos created_at y updated_at
    underscored: true,
    freezeTableName: true
  };

  const UserProjectsModel = sequelize.define("user_projects_model", attributes, options);

  UserProjectsModel.associate = function (models) {
    UserProjectsModel.belongsTo(models.users_model, {
      foreignKey: "user_id",
      as: "user"
    });

    UserProjectsModel.belongsTo(models.projects_model, {
      foreignKey: "project_id",
      as: "project"
    });
  };

  return UserProjectsModel;
};
