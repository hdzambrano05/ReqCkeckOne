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
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "project_id",
      autoIncrement: false,
      references: {
        key: "id",
        model: "projects_model"
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
    title: {
      type: DataTypes.CHAR(150),
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "title",
      autoIncrement: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "description",
      autoIncrement: false
    },
    status: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      defaultValue: "todo",
      comment: null,
      primaryKey: false,
      field: "status",
      autoIncrement: false
    },
    priority: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      defaultValue: "medium",
      comment: null,
      primaryKey: false,
      field: "priority",
      autoIncrement: false
    },
    assignee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "assignee_id",
      autoIncrement: false,
      references: {
        key: "id",
        model: "users_model"
      }
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "due_date",
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
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      comment: null,
      primaryKey: false,
      field: "updated_at",
      autoIncrement: false
    }
  };
  const options = {
    tableName: "tasks",
    comment: "",
    indexes: [],
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'public'
  };
  const TasksModel = sequelize.define("tasks_model", attributes, options);
  TasksModel.associate = function (models) {
    // Cada tarea pertenece a un proyecto
    TasksModel.belongsTo(models.projects_model, { foreignKey: 'project_id', as: 'project' });

    // Cada tarea puede estar relacionada con un requisito
    TasksModel.belongsTo(models.requirements_model, { foreignKey: 'requirement_id' , as: 'requirement' });

    // Cada tarea tiene un usuario asignado
    TasksModel.belongsTo(models.users_model, { foreignKey: 'assignee_id', as: 'assignedUser' });

    // Cada tarea puede tener muchos comentarios
    TasksModel.hasMany(models.comments_model, { foreignKey: 'task_id' });
  };

  return TasksModel;
};