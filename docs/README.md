# FrontEnd_Fantasy

Este es el repositorio para el frontend del trabajo de desarrollo de software

## Testing

```bash
# Tests unitarios con Vitest
pnpm test

# Tests E2E con Cypress
pnpm cypress        # Modo interactivo
pnpm cypress:run    # Modo headless
```

##  Estructura del Proyecto

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

## Scripts Disponibles

| Comando      | Descripción            |
| ------------ | ---------------------- |
| `pnpm dev`   | Servidor de desarrollo |
| `pnpm build` | Build de producción    |
| `pnpm test`  | Ejecutar tests         |
| `pnpm lint`  | Linter ESLint          |
