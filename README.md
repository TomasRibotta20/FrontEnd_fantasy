# TurboFantasy - Frontend

Aplicación web de Fantasy Football desarrollada con React, TypeScript y Vite.

## 🚀 Tecnologías

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS 4** - Estilos
- **React Router 7** - Navegación
- **Axios** - Cliente HTTP
- **React Hook Form + Zod** - Formularios y validación

## 📋 Requisitos Previos

- Node.js 18+
- pnpm (recomendado) o npm

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd FrontEnd_Fantasy

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend
```

## 🏃 Ejecución

```bash
# Modo desarrollo
pnpm dev

# Build para producción
pnpm build

# Preview del build
pnpm preview
```

## 🧪 Testing

```bash
# Tests unitarios con Vitest
pnpm test

# Tests E2E con Cypress
pnpm cypress        # Modo interactivo
pnpm cypress:run    # Modo headless
```

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes React
│   ├── auth/       # Autenticación
│   ├── navbar/     # Navegación
│   └── pages/      # Páginas principales
├── contexts/       # React Context (Auth)
├── hooks/          # Custom hooks
├── services/       # Llamadas a API
├── styles/         # CSS global
├── types/          # Tipos TypeScript
└── utils/          # Utilidades
```

## 🔗 Variables de Entorno

```env
VITE_API_URL=http://localhost:3000
```

## 📝 Scripts Disponibles

| Comando      | Descripción            |
| ------------ | ---------------------- |
| `pnpm dev`   | Servidor de desarrollo |
| `pnpm build` | Build de producción    |
| `pnpm test`  | Ejecutar tests         |
| `pnpm lint`  | Linter ESLint          |
