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
    title: {
      type: DataTypes.CHAR(150),
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "title",
      autoIncrement: false
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
    context: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "context",
      autoIncrement: false
    },
    status: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      defaultValue: "draft",
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
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "due_date",
      autoIncrement: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: "1",
      comment: null,
      primaryKey: false,
      field: "version",
      autoIncrement: false
    },
    analysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "analysis",
      autoIncrement: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "created_by",
      autoIncrement: false,
      references: {
        key: "id",
        model: "users_model"
      }
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
    tableName: "requirements",
    comment: "",
    indexes: [],
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'public'
  };
  const RequirementsModel = sequelize.define("requirements_model", attributes, options);
  RequirementsModel.associate = function (models) {
    // Cada requisito pertenece a un proyecto
    RequirementsModel.belongsTo(models.projects_model, { foreignKey: 'project_id', as: 'project' });

    // Cada requisito tiene un creador (usuario)
    RequirementsModel.belongsTo(models.users_model, { 
      foreignKey: 'created_by' 
    });

    // Un requisito puede tener muchas versiones
    RequirementsModel.hasMany(models.requirement_history_model, { foreignKey: 'requirement_id' });

    // Un requisito puede tener muchas tareas
    RequirementsModel.hasMany(models.tasks_model, { foreignKey: 'requirement_id' });

    // Un requisito puede tener muchos comentarios
    RequirementsModel.hasMany(models.comments_model, { foreignKey: 'requirement_id' });
  };

  return RequirementsModel;
};