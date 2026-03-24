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
    username: {
      type: DataTypes.CHAR(50),
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "username",
      autoIncrement: false,
      unique: "users_username_key"
    },
    email: {
      type: DataTypes.CHAR(100),
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "email",
      autoIncrement: false,
      unique: "users_email_key"
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "password_hash",
      autoIncrement: false
    },
    role: {
      type: DataTypes.CHAR(20),
      allowNull: true,
      defaultValue: "user",
      comment: null,
      primaryKey: false,
      field: "role",
      autoIncrement: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "last_login",
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
    tableName: "users",
    comment: "",
    indexes: [],
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'public'
  };
  const UsersModel = sequelize.define("users_model", attributes, options);
  UsersModel.associate = function (models) {
    UsersModel.hasMany(models.projects_model, {
      foreignKey: 'owner_id',
      as: 'ownedProjects'
    });

    UsersModel.hasMany(models.requirements_model, {
      foreignKey: 'created_by'
    });

    // Un usuario puede ser asignado a muchas tareas
    UsersModel.hasMany(models.tasks_model, { foreignKey: 'assignee_id', as: 'assignedTasks' });

    // Un usuario puede escribir muchos comentarios
    UsersModel.hasMany(models.comments_model, { foreignKey: 'user_id' });

    UsersModel.belongsToMany(models.projects_model, {
      through: { model: 'user_projects', unique: false },  // 👈
      as: 'projects',
      foreignKey: 'user_id'
    });
  };


  return UsersModel;
};