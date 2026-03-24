const {
  DataTypes
} = require('sequelize');
module.exports = sequelize => {
  const attributes = {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: true,
      field: "id",
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "user_id",
      autoIncrement: false,
      references: {
        key: "id",
        model: "users_model"
      }
    },
    requirement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "requirement_id",
      autoIncrement: false,
      references: {
        key: "id",
        model: "requirements_model"
      }
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "task_id",
      autoIncrement: false,
      references: {
        key: "id",
        model: "tasks_model"
      }
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "text",
      autoIncrement: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      comment: null,
      primaryKey: false,
      field: "created_at",
      autoIncrement: false
    }
  };
  const options = {
    tableName: "comments",
    comment: "",
    indexes: [],
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'public'
  };
  const CommentsModel = sequelize.define("comments_model", attributes, options);
  CommentsModel.associate = function (models) {
    // Cada comentario pertenece a un usuario
    CommentsModel.belongsTo(models.users_model, { foreignKey: 'user_id' });

    // Cada comentario puede pertenecer a un requisito
    CommentsModel.belongsTo(models.requirements_model, { foreignKey: 'requirement_id' });

    // Cada comentario puede pertenecer a una tarea
    CommentsModel.belongsTo(models.tasks_model, { foreignKey: 'task_id' });
  };

  return CommentsModel;
};