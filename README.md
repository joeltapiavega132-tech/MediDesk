# MediDesk — Sistema de Gestión para Consultorio Médico

> Desarrollado por **Yanax Studio** · Quito, Ecuador

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| PDF | pdfkit (backend) |
| Email | Nodemailer + Gmail SMTP |

## Estructura del proyecto

```
medidesk/
├── frontend/          # React app (Vite)
│   └── src/
│       ├── components/
│       │   ├── ui/        # Spinner, Modal, StatCard, EmptyState
│       │   └── layout/    # Sidebar, AppLayout, ProtectedRoute
│       ├── context/       # AuthContext
│       ├── hooks/         # usePacientes, useCitas, ...
│       ├── lib/           # supabase.js, constants.js
│       └── pages/         # Una carpeta por módulo
│           ├── auth/
│           ├── agenda/
│           ├── pacientes/
│           ├── certificados/
│           ├── contabilidad/
│           └── configuracion/
│
└── backend/           # Node.js + Express API
    ├── src/
    │   ├── routes/        # certificados.js, email.js
    │   ├── controllers/   # lógica de negocio
    │   └── index.js
    └── sql/
        └── schema.sql     # Schema completo de Supabase
```

## Cómo arrancar

### 1. Clonar y configurar variables de entorno

```bash
# Frontend
cp frontend/.env.example frontend/.env
# Llenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# Backend
cp backend/.env.example backend/.env
# Llenar credenciales SMTP y Supabase service role
```

### 2. Instalar dependencias

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 3. Crear tablas en Supabase

Ir al SQL Editor de tu proyecto Supabase y ejecutar el archivo:
```
backend/sql/schema.sql
```

### 4. Crear usuario inicial (admin)

En el Authentication panel de Supabase, crear un usuario. Luego en SQL Editor:
```sql
INSERT INTO perfiles (id, nombre, rol)
VALUES ('<uuid-del-usuario>', 'Nombre Admin', 'admin');
```

### 5. Correr en desarrollo

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Backend
cd backend && npm run dev
```

Frontend: http://localhost:5173  
Backend:  http://localhost:3001

## Módulos (fases de desarrollo)

- **Fase 1** ✅ Auth + Pacientes + Dashboard
- **Fase 2** 🔄 Agenda y Citas
- **Fase 3** ⏳ Certificados + Fotos Before/After
- **Fase 4** ⏳ Contabilidad
- **Fase 5** ⏳ Backup + LOPDP + Notificaciones
- **Fase 6** ⏳ Facturación SRI (Datil API)
- **Fase 7** ⏳ Pulido + Capacitación
