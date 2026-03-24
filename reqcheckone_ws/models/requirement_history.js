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
    requirement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "version",
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
    analysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "analysis",
      autoIncrement: false
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
      primaryKey: false,
      field: "changed_by",
      autoIncrement: false,
      references: {
        key: "id",
        model: "users_model"
      }
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
    tableName: "requirement_history",
    comment: "",
    indexes: [],
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'public'
  };
  const RequirementHistoryModel = sequelize.define("requirement_history_model", attributes, options);
  RequirementHistoryModel.associate = function (models) {
    // Cada versión pertenece a un requisito
    RequirementHistoryModel.belongsTo(models.requirements_model, { foreignKey: 'requirement_id', as: 'requirement' });

    // Cada versión tiene un usuario que la cambió
    RequirementHistoryModel.belongsTo(models.users_model, { foreignKey: 'changed_by', as: 'changer' });
  };

  return RequirementHistoryModel;
};