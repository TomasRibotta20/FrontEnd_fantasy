/**
 * Tests E2E para el flujo de onboarding
 *
 * Journey del nuevo usuario:
 *   Registro → auto-login → /torneos (vacío) → Crear torneo → Dashboard
 *
 * NOTA: Ya NO existe la ruta /CreateTeam.
 *       El equipo se crea al unirse / crear un torneo.
 */

describe('Onboarding Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: Flujo completo – Registro → /torneos → Crear Torneo
  // ──────────────────────────────────────────────────────────────────────────
  it('should complete onboarding until create torneo form is ready to submit', () => {
    const uniqueTs = Date.now();
    const newUser = {
      username: `onboard_${uniqueTs}`,
      email: `onboard_${uniqueTs}@example.com`,
      password: 'NewUser123!',
    };

    // PASO 1: Registrar usuario (redirige a /torneos automáticamente)
    cy.register(newUser.username, newUser.email, newUser.password);

    // PASO 2: Verificar que la página de torneos cargó y muestra estado vacío
    cy.contains('h1', 'Mis Torneos', { timeout: 10000 }).should('be.visible');
    cy.contains(/no tienes torneos/i).should('be.visible');

    // PASO 3: Click en "Crear Torneo"
    cy.contains('button', 'Crear Torneo').first().click();
    cy.url().should('include', '/torneos/crear', { timeout: 10000 });

    // PASO 4: Completar formulario de creación de torneo
    cy.contains('h1', 'Crear Nuevo Torneo', { timeout: 10000 }).should(
      'be.visible'
    );

    // Nombre del torneo
    cy.get('input[placeholder*="Liga Premier"]')
      .should('be.visible')
      .type(`Torneo E2E Onboarding ${uniqueTs}`);

    // Cupo máximo
    cy.get('input[type="number"]').click().type('{selectall}4');

    // Nombre del equipo
    cy.get('input[placeholder*="Galácticos"]')
      .should('be.visible')
      .type(`Mi Primer Equipo ${uniqueTs}`);

    // PASO 5: Formulario listo para enviar
    cy.get('input[name="nombre"]').should(
      'have.value',
      `Torneo E2E Onboarding ${uniqueTs}`
    );
    cy.get('input[name="cupoMaximo"]').should('have.value', '4');
    cy.get('input[name="nombre_equipo"]').should(
      'have.value',
      `Mi Primer Equipo ${uniqueTs}`
    );
    cy.contains('button', 'Crear Torneo').should('be.enabled');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: Estado vacío de torneos para usuario nuevo
  // ──────────────────────────────────────────────────────────────────────────
  it('should show empty state when user has no torneos', () => {
    const newUser = {
      username: `empty_${Date.now()}`,
      email: `empty_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    // Página de torneos vacía
    cy.contains('h1', 'Mis Torneos').should('be.visible');
    cy.contains(/no tienes torneos/i).should('be.visible');
    cy.contains(
      /crea un nuevo torneo o únete a uno existente/i
    ).should('be.visible');

    // Botones de acción visibles
    cy.contains('button', 'Crear Torneo').should('be.visible');
    cy.contains('button', /unirse a torneo/i).should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: Navegación a "Unirse a Torneo"
  // ──────────────────────────────────────────────────────────────────────────
  it('should navigate to join torneo page and show code input', () => {
    const newUser = {
      username: `join_${Date.now()}`,
      email: `join_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    // Click en "Unirse a Torneo"
    cy.contains('button', /unirse a torneo/i).first().click();
    cy.url().should('include', '/torneos/unirse', { timeout: 10000 });

    // Verificar UI del paso 1
    cy.contains('h1', 'Unirse a Torneo', { timeout: 10000 }).should(
      'be.visible'
    );
    cy.get('input[placeholder*="ABC123"]').should('be.visible');
    cy.contains('button', 'Validar Código').should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: Código inválido al unirse muestra error
  // ──────────────────────────────────────────────────────────────────────────
  it('should show error when joining with invalid code', () => {
    const newUser = {
      username: `badcode_${Date.now()}`,
      email: `badcode_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    cy.contains('button', /unirse a torneo/i).first().click();
    cy.url().should('include', '/torneos/unirse');

    // Ingresar código inválido
    cy.get('input[placeholder*="ABC123"]').type('XXXXXX');
    cy.contains('button', 'Validar Código').click();

    // Debe mostrar error
    cy.contains(/inválido|no disponible|error/i, { timeout: 10000 }).should(
      'be.visible'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 5: Validaciones del formulario de crear torneo
  // ──────────────────────────────────────────────────────────────────────────
  it('should validate required fields when creating torneo', () => {
    const newUser = {
      username: `validate_${Date.now()}`,
      email: `validate_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    cy.contains('button', 'Crear Torneo').first().click();
    cy.url().should('include', '/torneos/crear');

    // Intentar enviar sin completar campos requeridos
    cy.contains('button', 'Crear Torneo').click();

    // El navegador bloquea el submit por required; debe permanecer en la misma ruta
    cy.url().should('include', '/torneos/crear');
    cy.get('input:invalid').should('have.length.greaterThan', 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 6: El cupo máximo tiene restricciones (min 2, max 5)
  // ──────────────────────────────────────────────────────────────────────────
  it('should validate cupo range when creating torneo', () => {
    const newUser = {
      username: `cupo_${Date.now()}`,
      email: `cupo_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    cy.contains('button', 'Crear Torneo').first().click();
    cy.url().should('include', '/torneos/crear');

    // Completar nombre y equipo
    cy.get('input[placeholder*="Liga Premier"]').type('Torneo Test Cupo');
    cy.get('input[placeholder*="Galácticos"]').type('Equipo Test');

    // Intentar con cupo = 1 (menor que el mínimo)
    cy.get('input[type="number"]').clear().type('1');
    cy.contains('button', 'Crear Torneo').click();

    cy.contains(/mínimo|debe ser 2/i, { timeout: 5000 }).should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 7: Botón "Cancelar" en crear torneo vuelve a /torneos
  // ──────────────────────────────────────────────────────────────────────────
  it('should go back to torneos when clicking cancel', () => {
    const newUser = {
      username: `cancel_${Date.now()}`,
      email: `cancel_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    cy.contains('button', 'Crear Torneo').first().click();
    cy.url().should('include', '/torneos/crear');

    // Click en Cancelar
    cy.contains('button', 'Cancelar').click();

    // Vuelve a /torneos
    cy.url().should('match', /\/torneos$/, { timeout: 10000 });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 8: Filtros de torneos funcionan correctamente
  // ──────────────────────────────────────────────────────────────────────────
  it('should display torneo filter buttons', () => {
    const newUser = {
      username: `filter_${Date.now()}`,
      email: `filter_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };

    cy.register(newUser.username, newUser.email, newUser.password);

    // Verificar que existen los botones de filtro
    cy.contains('button', 'Todos').should('be.visible');
    cy.contains('button', 'En Espera').should('be.visible');
    cy.contains('button', 'Activos').should('be.visible');
    cy.contains('button', 'Finalizados').should('be.visible');

    // Click en un filtro y verificar que cambia el estado vacío
    cy.contains('button', 'Activos').click();
    cy.contains(/no tienes torneos/i).should('be.visible');
  });
});
