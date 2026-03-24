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
    name: {
      type: DataTypes.CHAR(100),
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "name",
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
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "owner_id",
      autoIncrement: false,
      references: {
        key: "id",
        model: "users_model"
      }
    },
    status: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      defaultValue: "active",
      comment: null,
      primaryKey: false,
      field: "status",
      autoIncrement: false
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "deadline",
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
    tableName: "projects",
    comment: "",
    indexes: [],
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'public'
  };
  const ProjectsModel = sequelize.define("projects_model", attributes, options);
  ProjectsModel.associate = function (models) {
    ProjectsModel.belongsTo(models.users_model,
      {
        foreignKey: 'owner_id',
        as: 'owner'
      }
    );

    // Un proyecto tiene muchos requisitos
    ProjectsModel.hasMany(models.requirements_model, { foreignKey: 'project_id' });

    // Un proyecto tiene muchas tareas
    ProjectsModel.hasMany(models.tasks_model, { foreignKey: 'project_id' });

    ProjectsModel.belongsToMany(models.users_model, {
      through: { model: 'user_projects', unique: false },  // 👈
      as: 'collaborators',
      foreignKey: 'project_id'
    });
  };


  return ProjectsModel;
};