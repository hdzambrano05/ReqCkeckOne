# 🚀 ReqCkeckOne_Full

**Tu plataforma integral para gestionar proyectos, requisitos y tareas en un solo lugar.**

---

## 📌 Descripción

**ReqCkeckOne_Full** es una aplicación **fullstack** diseñada para facilitar la gestión de **proyectos, requisitos, historial, tareas y comentarios**, ofreciendo un flujo de trabajo completo desde la planificación hasta el seguimiento.

Incluye:

* 🔑 **Autenticación segura** con JWT.
* 📂 **Gestión de proyectos y usuarios** con roles.
* 📝 **CRUD de requisitos** y su historial de cambios.
* ✅ **Gestión de tareas y comentarios** colaborativos.
* 🌐 **Interfaz web en Angular** conectada a un backend robusto en **Node.js + Express + Sequelize**.

---

## ⚙️ Stack tecnológico

| Capa              | Tecnología                         |
| ----------------- | ---------------------------------- |
| **Backend**       | Node.js · Express · Sequelize ORM  |
| **Frontend**      | Angular (TypeScript + Angular CLI) |
| **Base de datos** | PostgreSQL / MySQL                 |
| **Herramientas**  | npm · sequelize-cli · Angular CLI  |

---

## 🏗️ Estructura del proyecto

```
ReqCkeckOne_Full/
│
├── reqcheckone_ws/     # Backend (API REST)
│   ├── app.js          # Punto de entrada
│   ├── bin/www         # Servidor Express
│   ├── models/         # Modelos Sequelize
│   ├── migrations/     # Migraciones DB
│   ├── seeders/        # Datos iniciales
│   ├── routes/         # Endpoints API
│   └── controllers/    # Lógica de negocio
│
└── reqcheckone-cl/     # Frontend (Angular)
    └── src/app/        # Componentes, servicios y rutas
```

---

## 🔧 Requisitos previos

* Node.js **>= 14**
* npm **>= 6**
* PostgreSQL / MySQL (según configuración)
* Angular CLI (**solo para desarrollo frontend**):

```bash
npm install -g @angular/cli
```

---

## ⚡ Instalación rápida

### 🔹 Backend

```powershell
cd .\reqcheckone_ws
npm install
```

### 🔹 Frontend

```powershell
cd ..\reqcheckone-cl
npm install
```

---

## 🔑 Variables de entorno

Crea un archivo `.env` en `reqcheckone_ws/` con las siguientes variables:

```env
PORT=3000
DB_USERNAME=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=nombre_de_la_db
DB_HOST=localhost
DB_DIALECT=postgres
JWT_SECRET=un_secreto_largo
```

> 🔄 Cambia `DB_DIALECT` a `mysql` si usas MySQL.

---

## 🗄️ Base de datos

Ejecuta migraciones y seeders desde la carpeta backend:

```powershell
cd .\reqcheckone_ws
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

## ▶️ Ejecución

### Backend

```powershell
cd .\reqcheckone_ws
npm start
```

API disponible en: **[http://localhost:3000](http://localhost:3000)**

### Frontend

```powershell
cd .\reqcheckone-cl
npx ng serve --open
```

App disponible en: **[http://localhost:4200](http://localhost:4200)**

---

## 🔗 Ejemplos de API

### 🧑 Registro de usuario

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@example.com","password":"password123"}'
```

### 🔓 Login (JWT)

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"password123"}'
```

### 📌 Crear proyecto

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Proyecto A","description":"Descripción"}'
```

---

## 🧪 Tests

```powershell
cd .\reqcheckone_ws
npm test

cd ..\reqcheckone-cl
npm test
```

---

## 📦 Deployment

* Construir frontend:

```bash
cd reqcheckone-cl
ng build --prod
```

* Servir archivos estáticos desde backend o un CDN.
* Variables de entorno seguras (JWT_SECRET, DB).
* Docker y `docker-compose.yml` recomendados para levantar DB + API + frontend.

---

## 🤝 Contribuir

1. Haz un **fork** del repo.
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`.
3. Haz commit de tus cambios: `git commit -m "Agrego nueva funcionalidad"`.
4. Sube la rama: `git push origin feature/nueva-funcionalidad`.
5. Abre un **Pull Request**.

---

## 👨‍💻 Autor

* Harold Zambrano · [@hdzambrano05](https://github.com/hdzambrano05)
* Jeison Maigual · [@JeisonCol](https://github.com/JeisonCol))

---

## 📜 Licencia

📖 MIT License – Siéntete libre de usar y mejorar este proyecto.

---

## 🌟 Estado del proyecto

✔️ Documentación inicial completa
✔️ Backend con autenticación, proyectos y requisitos
✔️ Frontend Angular funcional
⬜ Docker Compose pendiente
⬜ Pruebas unitarias + integración (a mejorar)

---

✨ Este README está diseñado para ser **rápido, intuitivo y visual**, con bloques de comandos listos para copiar/pegar, tablas claras y ejemplos prácticos de API.
