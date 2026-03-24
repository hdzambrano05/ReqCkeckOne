const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const users = require('../models').users_model;
const projects = require('../models').projects_model;
const requirements = require('../models').requirements_model;
const tasks = require('../models').tasks_model;
const comments = require('../models').comments_model;


module.exports = {

    async login(req, res) {
        try {
            const { email, username, password } = req.body;

            if ((!email && !username) || !password) {
                return res.status(400).json({ message: 'Usuario/Email y contraseña requeridos' });
            }

            const whereClause = email ? { email } : { username };
            const user = await users.findOne({ where: whereClause });

            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Validar password con bcrypt
            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(password, user.password_hash);
            } catch (err) {
                return res.status(500).json({ message: 'Error al verificar contraseña' });
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Generar token JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
            );

            // Devolver usuario seguro (sin password_hash)
            const { password_hash, ...safeUser } = user.toJSON();
            res.status(200).json({ token, user: safeUser });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },


    list(req, res) {
        return users.findAll({
            attributes: { exclude: ['password_hash'] }
        })
            .then(userList => res.status(200).send(userList))
            .catch(error => res.status(400).send(error));
    },

    listFull(req, res) {
        return users.findAll({
            include: [
                {
                    model: projects,
                },
                {
                    model: projects,
                    as: 'collaboratedProjects',
                    through: {
                        attributes: ['role', 'joined_at'] // 👈 columnas de user_projects
                    }
                },
                {
                    model: requirements,
                },
                {
                    model: tasks,
                },
                {
                    model: comments

                }

            ]
        })
            .then(users => res.status(200).send(users))
            .catch(error => res.status(400).send(error));
    },

    getById(req, res) {
        return users.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        })
            .then(user => {
                if (!user) return res.status(404).send({ message: 'Usuario no encontrado' });
                res.status(200).send(user);
            })
            .catch(error => res.status(400).send(error));
    },

    add(req, res) {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).send({ message: 'Faltan campos obligatorios' });
        }

        const saltRounds = 12;
        bcrypt.hash(password, saltRounds)
            .then(hashedPassword => {
                return users.create({
                    username,
                    email,
                    password_hash: hashedPassword,
                    role: role || 'user'
                });
            })
            .then(user => {
                // no devolvemos el hash
                const { password_hash, ...safeUser } = user.toJSON();
                res.status(201).send(safeUser);
            })
            .catch(error => {
                console.error('Error al registrar usuario:', error);
                res.status(400).send({ message: 'Error al registrar usuario', error });
            });
    },

    update(req, res) {
        return users
            .findByPk(req.params.id)
            .then(users => {
                if (!users) {
                    return res.status(404).send({
                        message: 'users Not Found',
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
            .then(users => {
                if (!users) {
                    return res.status(404).send({
                        message: 'users Not Found',
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
