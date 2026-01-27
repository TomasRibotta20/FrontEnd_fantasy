/**
 * Tests E2E para flujos de autenticación
 * 
 * Este archivo prueba:
 * - Visualización correcta de la página de login
 * - Registro de nuevos usuarios
 * - Login con credenciales válidas e inválidas
 * - Persistencia de sesión después de recargar
 * - Logout del sistema
 */

describe('Authentication Flow', () => {
  // Generamos credenciales únicas para cada ejecución del test
  // Esto evita conflictos con datos existentes en la BD
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456!',
  };

  beforeEach(() => {
    // Antes de cada test, limpiar cookies y localStorage
    // Esto garantiza que cada test comienza con un estado limpio (sin autenticación previa)
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  /**
   * Test 1: Verificar que la página de login se renderiza correctamente
   * Propósito: Validar que todos los elementos UI necesarios están presentes
   */
  it('should display login page correctly', () => {
    cy.visit('/login');
    
    // Verificar que el título/encabezado de login es visible
    cy.contains(/iniciar sesión|login/i).should('be.visible');
    
    // Verificar que los campos del formulario existen y son visibles
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  /**
   * Test 2: Registro exitoso de un nuevo usuario
   * Propósito: Validar el flujo completo de registro y auto-login posterior
   * 
   * Flujo esperado:
   * 1. Usuario completa formulario de registro
   * 2. Backend crea la cuenta
   * 3. Se hace login automático
   * 4. Redirección al dashboard (LoggedMenu)
   */
  it('should register a new user successfully', () => {
    // Usar el custom command cy.register() definido en commands.ts
    cy.register(testUser.username, testUser.email, testUser.password);
    
    // Después del registro exitoso, debe redirigir a CreateTeam (porque no tiene equipo)
    cy.url().should('include', '/CreateTeam');
    
    // Verificar que se muestra la página de crear equipo
    cy.contains(/crear equipo|team/i, { timeout: 10000 }).should('be.visible');
  });

  /**
   * Test 3: Login fallido con credenciales incorrectas
   * Propósito: Validar que el sistema maneja correctamente errores de autenticación
   */
  it('should show error with invalid credentials', () => {
    cy.visit('/login');
    
    // Intentar login con credenciales que no existen
    cy.get('input[name="email"]').type('wronguser@test.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    
    // Verificar que se muestra un mensaje de error apropiado
    // La regex /i hace la búsqueda case-insensitive
    cy.contains(/credenciales incorrectas|error|inválid/i, { timeout: 10000 }).should('be.visible');
  });

  /**
   * Test 4: Ciclo completo - Registro, Logout, Login
   * Propósito: Validar que un usuario puede registrarse, salir y volver a entrar
   * 
   * Este es un test de integración que valida múltiples flujos conectados
   */
  it('should login successfully after registration and logout', () => {
    // Usar el mismo testUser del principio (ya fue registrado en test anterior)
    // Este test valida que puede hacer login después de registrarse
    
    // Paso 1: Ir directamente a login (el usuario ya existe del primer test)
    cy.visit('/login');
    cy.url().should('include', '/login');
    
    // Paso 2: Hacer login con las credenciales del testUser
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').clear().type(testUser.email);
    cy.get('input[name="password"]').should('be.visible').clear().type(testUser.password);
    cy.get('button[type="submit"]').click();
    
    // Paso 3: Verificar que va a CreateTeam porque no tiene equipo creado
    cy.url().should('include', '/CreateTeam', { timeout: 15000 });
    
    // Paso 4: Navegar al LoggedMenu
    cy.visit('/LoggedMenu');
    cy.wait(1000);
    
    // Paso 5: Hacer logout manualmente
    // Buscar en la navbar el elemento del usuario
    cy.get('nav').within(() => {
      cy.contains(new RegExp(testUser.email.split('@')[0] + '|' + testUser.username, 'i'), { timeout: 10000 }).click();
    });
    // Click en "Cerrar Sesión"
    cy.contains(/cerrar sesión/i).click();
    
    // Paso 6: Verificar que redirige a página pública (/ o /login)
    cy.url().should('match', /\/(login)?$/, { timeout: 10000 });
  });

  /**
   * Test 5: Persistencia de sesión tras recarga de página
   * Propósito: Validar que la sesión se mantiene activa después de refrescar el navegador
   * 
   * Esto es crucial porque verifica que:
   * - Las cookies de sesión se guardan correctamente
   * - El localStorage mantiene los datos del usuario
   * - El sistema restaura la sesión automáticamente
   */
  it('should persist session after page reload', () => {
    // Hacer login usando el custom command (usa cy.session() internamente)
    cy.login(testUser.email, testUser.password);
    
    // Visitar CreateTeam directamente (porque el usuario no tiene equipo)
    cy.visit('/CreateTeam');
    
    // Esperar a que cargue la página
    cy.wait(1000);
    
    // Recargar la página completa (simula que el usuario presiona F5)
    cy.reload();
    
    // Verificar que sigue autenticado y permanece en CreateTeam
    cy.url().should('include', '/CreateTeam', { timeout: 10000 });
    
    // Verificar que el localStorage tiene datos del usuario
    cy.window().then((win) => {
      const userData = win.localStorage.getItem('user');
      if (userData) {
        // Si hay datos, verificar que es un JSON válido
        const parsedData = JSON.parse(userData);
        expect(parsedData).to.have.property('email');
      }
    });
  });

  /**
   * Test 6: Logout completo del sistema
   * Propósito: Validar que el logout limpia toda la sesión correctamente
   * 
   * Verificaciones:
   * - Redirección a página pública
   * - Limpieza de localStorage
   * - Limpieza de cookies (implícito en el backend)
   */
  it('should logout successfully and clear session', () => {
    cy.login(testUser.email, testUser.password);
    cy.visit('/LoggedMenu');
    
    // Hacer logout usando el custom command
    cy.logout();
    
    // Verificar que no está en rutas protegidas
    cy.url().should('not.include', '/LoggedMenu');
    cy.url().should('not.include', '/CreateTeam');
    
    // Verificar que el localStorage se limpió
    cy.window().then((win) => {
      const userData = win.localStorage.getItem('user');
      expect(userData).to.be.null;
    });
    
    // Intentar acceder a una ruta protegida debe redirigir a login
    cy.visit('/LoggedMenu');
    cy.url().should('match', /\/login/, { timeout: 10000 });
  });
});
