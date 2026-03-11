# TurboFantasy - Frontend

Aplicación web de Fantasy Football desarrollada con React, TypeScript y Vite.

## Requisitos Previos

| Requisito          | Descripción / Valor Recomendado |
| ------------------ | ------------------------------- |
| Node.js            | v22.16.0 o superior             |
| Gestor de Paquetes | pnpm v10.11.0 o superior        |
| Git                | Instalado                       |
| Backend            | BackEnd_Fantasy en ejecución    |

## Tecnologías

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS 4** - Estilos
- **React Router 7** - Navegación
- **Axios** - Cliente HTTP
- **React Hook Form + Zod** - Formularios y validación

## Instalación

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

## Variables de Entorno
Por defecto, la aplicación frontend intenta conectarse al backend en `http://localhost:3000` (o el puerto que esté configurado en el backend). Si necesitas modificar esta configuración, revisa los archivos de configuración en la raíz del proyecto.

```env
VITE_API_URL=http://localhost:3000
```

## Pasos de Ejecución

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TomasRibotta20/FrontEnd_fantasy.git
   cd FrontEnd_fantasy
   ```
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   pnpm run dev
   ```


Link A la Proposal: https://github.com/TomasRibotta20/TPDSW
