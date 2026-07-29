# Guía de Despliegue 100% Gratuito — COARC RefManager

Esta guía explica cómo desplegar la aplicación completa (Frontend React + Backend Node.js + Base de Datos PostgreSQL) de forma **100% gratuita y permanente** usando la combinación ideal de servicios en la nube:

| Servicio | Qué aloja | Plan Gratuito |
|---|---|---|
| 🗄️ [Neon Postgres](https://neon.tech) | Base de datos PostgreSQL | ✅ 512 MB permanente |
| ⚙️ [Render](https://render.com) | Backend Node.js/Express | ✅ Gratuito permanente |
| 💻 [Vercel](https://vercel.com) | Frontend React/Vite | ✅ Ilimitado |

---

## PASO 1: Subir el Proyecto a GitHub

Asegúrate de que tu proyecto esté subido a un repositorio en **GitHub**.

---

## PASO 2: Configurar la Base de Datos en Neon

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratuita con GitHub.
2. Crea un nuevo proyecto y llámalo `coarc-refmanager`.
3. En el panel (**Dashboard**), busca la sección **Connection Details**.
4. Copia la URL de conexión (tendrá un formato como este):
   ```text
   postgresql://usuario:contraseña@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Guarda esa URL, la usarás en el Paso 3.

---

## PASO 3: Desplegar el Backend en Render

1. Ve a [render.com](https://render.com) y crea una cuenta gratuita con GitHub.
2. Haz clic en **New +** → **Web Service**.
3. Conecta tu repositorio de GitHub `Trabajo-arbitro`.
4. Completa la configuración:
   - **Name**: `coarc-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. En la sección **Environment Variables**, agrega:

| Key | Value |
|---|---|
| `PORT` | `5000` |
| `DATABASE_URL` | *(La URL completa copiada de Neon en el Paso 2)* |
| `JWT_SECRET` | *(Una clave secreta aleatoria o tu frase secreta)* |
| `FRONTEND_URL` | `*` *(lo actualizaremos en el paso final)* |

6. Haz clic en **Create Web Service**. Render compilará e iniciará el backend.
7. Copia la URL que te asigna Render (ej. `https://coarc-backend.onrender.com`).

---

## PASO 4: Desplegar el Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **Add New...** → **Project**.
3. Importa tu repositorio `Trabajo-arbitro`.
4. En la configuración:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
5. En **Environment Variables**, agrega:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://coarc-backend.onrender.com/api` |
*(Reemplaza con la URL de tu backend en Render agregando `/api` al final)*

6. Haz clic en **Deploy**. Vercel generará tu enlace público (ej. `https://coarc-refmanager.vercel.app`).

---

## PASO 5: Actualizar CORS en Render

1. Vuelve al panel de **Render.com** → tu servicio `coarc-backend` → **Environment**.
2. Actualiza la variable `FRONTEND_URL` con tu URL real de Vercel:
   ```env
   FRONTEND_URL=https://coarc-refmanager.vercel.app
   ```
3. Guarda los cambios. Render reiniciará el servicio automáticamente.

---

## PASO 6: Verificación Final e Instalación PWA

1. Abre tu enlace de Vercel en el navegador.
2. Regístrate con tu correo. **El primer usuario registrado se convierte automáticamente en el Administrador (Admin)**.
3. Haz clic en el botón flotante **"Instalar App"** para instalar la PWA en tu teléfono o PC.
