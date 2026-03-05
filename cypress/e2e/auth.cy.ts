/**
 * Tests E2E para flujos de autenticación
 *
 * Prueba:
 * - Visualización correcta de la página de login
 * - Registro de nuevos usuarios
 * - Login con credenciales válidas e inválidas
 * - Persistencia de sesión después de recargar
 * - Logout del sistema
 */

describe('Authentication Flow', () => {
  // Credenciales únicas por ejecución para evitar colisiones en la BD
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456!',
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: La página de login se renderiza correctamente
  // ──────────────────────────────────────────────────────────────────────────
  it('should display login page correctly', () => {
    cy.visit('/login');

    // Título del formulario (CustoFormHookForm con title="Iniciar Sesión")
    cy.contains('h2', 'Iniciar Sesión').should('be.visible');

    // Campos del formulario
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');

    // Botón submit con texto "Ingresar"
    cy.contains('button', 'Ingresar').should('be.visible');

    // Links auxiliares
    cy.contains(/¿olvidaste tu contraseña/i).should('be.visible');
    cy.contains('button', /regístrate aquí/i).should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: La página de registro se renderiza correctamente
  // ──────────────────────────────────────────────────────────────────────────
  it('should display register page correctly', () => {
    cy.visit('/CreateUser');

    // Título del formulario
    cy.contains('h2', 'Registro de Usuario').should('be.visible');

    // Campos: nombre, email, password
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');

    // Botón submit con texto "Registrate!"
    cy.contains('button', 'Registrate!').should('be.visible');

    // Link a login
    cy.contains('button', /inicia sesión aquí/i).should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: Registro exitoso de un nuevo usuario
  // ──────────────────────────────────────────────────────────────────────────
  it('should register a new user successfully', () => {
    cy.register(testUser.username, testUser.email, testUser.password);

    // Después del registro exitoso redirige a /torneos (usuario nuevo, sin torneos)
    cy.url().should('include', '/torneos');

    // Verificar que la página de torneos cargó
    cy.contains(/mis torneos/i, { timeout: 10000 }).should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: Login fallido con credenciales incorrectas
  // ──────────────────────────────────────────────────────────────────────────
  it('should show error with invalid credentials', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type('wrong@test.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    // Mensaje de error del componente Login
    cy.contains(/error al iniciar sesión|verifica tus credenciales/i, {
      timeout: 10000,
    }).should('be.visible');

    // Debe seguir en /login (no redirige)
    cy.url().should('include', '/login');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 5: Ciclo completo – Registro → Logout → Login
  // ──────────────────────────────────────────────────────────────────────────
  it('should login successfully after registration and logout', () => {
    // Paso 1: Registrar usuario nuevo
    const cycleUser = {
      username: `cycle_${Date.now()}`,
      email: `cycle_${Date.now()}@example.com`,
      password: 'Cycle123456!',
    };

    cy.register(cycleUser.username, cycleUser.email, cycleUser.password);
    cy.url().should('include', '/torneos');

    // Paso 2: Logout
    cy.logout();
    cy.url().should('match', /\/(login)?$/);

    // Paso 3: Login con las mismas credenciales
    cy.visit('/login');
    cy.get('input[name="email"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(cycleUser.email);
    cy.get('input[name="password"]').should('be.visible').clear().type(cycleUser.password);
    cy.get('button[type="submit"]').click();

    // Usuario nuevo sin torneos → redirige a /torneos
    cy.url().should('include', '/torneos', { timeout: 15000 });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 6: Persistencia de sesión tras recarga de página
  // ──────────────────────────────────────────────────────────────────────────
  it('should persist session after page reload', () => {
    // Registrar un usuario fresco para este test
    const persistUser = {
      username: `persist_${Date.now()}`,
      email: `persist_${Date.now()}@example.com`,
      password: 'Persist123!',
    };

    cy.register(persistUser.username, persistUser.email, persistUser.password);
    cy.url().should('include', '/torneos');

    // Recargar la página (simula F5)
    cy.reload();

    // Debe seguir autenticado y permanecer en /torneos (o redirigido a ruta protegida)
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Verificar que el navbar muestra el username (señal de que la sesión persiste)
    cy.get('nav').should('contain', persistUser.username);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 7: Logout completo – limpia sesión y redirige
  // ──────────────────────────────────────────────────────────────────────────
  it('should logout successfully and clear session', () => {
    const logoutUser = {
      username: `logout_${Date.now()}`,
      email: `logout_${Date.now()}@example.com`,
      password: 'Logout123!',
    };

    cy.register(logoutUser.username, logoutUser.email, logoutUser.password);
    cy.url().should('include', '/torneos');

    // Hacer logout
    cy.logout();

    // Verificar que salió a login o landing
    cy.url().should('match', /\/(login)?$/);

    // Verificar que el localStorage se limpió
    cy.window().then((win) => {
      const userData = win.localStorage.getItem('user');
      expect(userData).to.be.null;
    });

    // Intentar acceder a una ruta protegida → redirige a /login
    cy.visit('/LoggedMenu');
    cy.url().should('include', '/login', { timeout: 10000 });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 8: /login accesible aunque esté autenticado (ruta pública actual)
  // ──────────────────────────────────────────────────────────────────────────
  it('should allow authenticated user to open login page', () => {
    const authUser = {
      username: `authredirect_${Date.now()}`,
      email: `authredirect_${Date.now()}@example.com`,
      password: 'AuthRedir123!',
    };

    cy.register(authUser.username, authUser.email, authUser.password);
    cy.url().should('include', '/torneos');

    // /login no está envuelta en PublicRoute en App.tsx, por lo que sigue accesible
    cy.visit('/login');
    cy.url().should('include', '/login', { timeout: 10000 });
    cy.contains('h2', 'Iniciar Sesión').should('be.visible');
  });
});
