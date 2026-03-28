const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require('sequelize');

const users = require("../models").users_model;
const projects = require("../models").projects_model;
const requirements = require("../models").requirements_model;
const tasks = require("../models").tasks_model;
const comments = require("../models").comments_model;

module.exports = {
  async login(req, res) {
    try {
      const { email, username, password } = req.body;

      if ((!email && !username) || !password) {
        return res
          .status(400)
          .json({ message: "Usuario/Email y contraseña requeridos" });
      }

      const whereClause = email ? { email } : { username };
      const user = await users.findOne({ where: whereClause });

      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Validar password con bcrypt
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        return res
          .status(500)
          .json({ message: "Error al verificar contraseña" });
      }

      if (!isMatch) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
      );

      // Devolver usuario seguro (sin password_hash)
      const { password_hash, ...safeUser } = user.toJSON();
      res.status(200).json({ token, user: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { identifier } = req.body;

      if (!identifier || !identifier.trim()) {
        return res.status(400).json({
          message: "Debe ingresar un nombre de usuario o correo",
        });
      }

      const cleanIdentifier = identifier.trim();

      const user = await users.findOne({
        where: {
          [Op.or]: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado",
        });
      }

      const resetToken = jwt.sign(
        {
          id: user.id,
          purpose: "password-reset",
        },
        process.env.JWT_SECRET || "secret_temporal",
        { expiresIn: "10m" },
      );

      return res.status(200).json({
        message: "Usuario encontrado",
        resetToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("forgotPassword error:", error);
      return res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  },

  async resetPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret_temporal"
      );
    } catch (error) {
      return res.status(401).json({
        message: "Token inválido o expirado"
      });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(401).json({
        message: "Token no válido"
      });
    }

    const user = await users.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await user.update({
      password_hash: hashedPassword
    });

    return res.status(200).json({
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
},

  list(req, res) {
    return users
      .findAll({
        attributes: { exclude: ["password_hash"] },
      })
      .then((userList) => res.status(200).send(userList))
      .catch((error) => res.status(400).send(error));
  },

  listFull(req, res) {
    return users
      .findAll({
        include: [
          {
            model: projects,
          },
          {
            model: projects,
            as: "collaboratedProjects",
            through: {
              attributes: ["role", "joined_at"], // 👈 columnas de user_projects
            },
          },
          {
            model: requirements,
          },
          {
            model: tasks,
          },
          {
            model: comments,
          },
        ],
      })
      .then((users) => res.status(200).send(users))
      .catch((error) => res.status(400).send(error));
  },

  getById(req, res) {
    return users
      .findByPk(req.params.id, {
        attributes: { exclude: ["password_hash"] },
      })
      .then((user) => {
        if (!user)
          return res.status(404).send({ message: "Usuario no encontrado" });
        res.status(200).send(user);
      })
      .catch((error) => res.status(400).send(error));
  },

  add(req, res) {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send({ message: "Faltan campos obligatorios" });
    }

    const saltRounds = 12;
    bcrypt
      .hash(password, saltRounds)
      .then((hashedPassword) => {
        return users.create({
          username,
          email,
          password_hash: hashedPassword,
          role: role || "user",
        });
      })
      .then((user) => {
        // no devolvemos el hash
        const { password_hash, ...safeUser } = user.toJSON();
        res.status(201).send(safeUser);
      })
      .catch((error) => {
        console.error("Error al registrar usuario:", error);
        res.status(400).send({ message: "Error al registrar usuario", error });
      });
  },

  update(req, res) {
    return users
      .findByPk(req.params.id)
      .then((users) => {
        if (!users) {
          return res.status(404).send({
            message: "users Not Found",
          });
        }
        return users
          .update({
            username: req.body.username || users.username,
            email: req.body.email || users.email,
            password_hash: req.body.password_hash || users.password_hash,
            role: req.body.role || users.role,
          })
          .then(() => res.status(200).send(users))
          .catch((error) => res.status(400).send(error));
      })
      .catch((error) => res.status(400).send(error));
  },

  delete(req, res) {
    return users
      .findByPk(req.params.id)
      .then((users) => {
        if (!users) {
          return res.status(404).send({
            message: "users Not Found",
          });
        }
        return users
          .destroy()
          .then(() => res.status(204).send())
          .catch((error) => res.status(400).send(error));
      })
      .catch((error) => res.status(400).send(error));
  },
};
