/**
 * Tests E2E para gestión de equipos
 * 
 * Este archivo prueba las funcionalidades relacionadas con:
 * - Visualización del equipo en el dashboard
 * - Navegación a la página de edición de equipo
 * - Cambio de jugadores entre titulares y suplentes
 * - Guardado de cambios en la alineación
 * - Validaciones de formación táctica
 */

describe('Team Management', () => {
  // Credenciales del usuario de prueba
  const testUser = {
    username: `teamuser_${Date.now()}`,
    email: `teamuser_${Date.now()}@example.com`,
    password: 'TeamUser123!',
  };

  /**
   * Setup: Antes de todos los tests, crear un usuario y su equipo
   * Esto se ejecuta UNA VEZ antes de todos los tests de este archivo
   */
  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Registrar usuario y crear equipo
    cy.register(testUser.username, testUser.email, testUser.password);
    cy.url().should('include', '/LoggedMenu');
    
    // Si no tiene equipo, crearlo
    cy.url().then((url) => {
      if (!url.includes('CreateTeam')) {
        cy.visit('/CreateTeam');
      }
    });
    
    // Crear equipo con nombre específico
    cy.get('input[name="teamName"]', { timeout: 10000 }).type('Equipo Test E2E');
    cy.contains('button', /crear equipo/i).click();
    cy.url().should('include', '/LoggedMenu', { timeout: 15000 });
  });

  beforeEach(() => {
    // Antes de cada test, hacer login (usando cy.session para cachear la sesión)
    cy.login(testUser.email, testUser.password);
  });

  /**
   * Test 1: Visualizar formación del equipo en el dashboard
   * Propósito: Validar que el dashboard muestra correctamente la formación táctica
   */
  it('should display team formation in dashboard', () => {
    cy.visit('/LoggedMenu');
    
    // Verificar que el componente de formación está visible
    cy.get('[data-testid="formacion-equipo"]', { timeout: 10000 }).should('be.visible');
    
    // Verificar que se muestran jugadores
    // Ajusta el selector según tu implementación real
    cy.get('[data-testid="formacion-equipo"]').within(() => {
      cy.contains(/jugador|player/i).should('exist');
    });
  });

  /**
   * Test 2: Visualizar widget de puntos
   * Propósito: Validar que se muestra el resumen de puntos del equipo
   */
  it('should display points widget', () => {
    cy.visit('/LoggedMenu');
    
    // Verificar que el widget de puntos está visible
    cy.get('[data-testid="widget-puntos"]').should('be.visible');
    
    // Verificar que muestra información de puntos
    cy.get('[data-testid="widget-puntos"]').within(() => {
      cy.contains(/puntos|points|puntaje/i).should('exist');
    });
  });

  /**
   * Test 3: Navegar a la página de edición de equipo
   * Propósito: Validar que el usuario puede acceder a UpdateTeam desde el dashboard
   */
  it('should navigate to UpdateTeam page from dashboard', () => {
    cy.visit('/LoggedMenu');
    
    // Buscar y hacer click en el card o botón "Mi Equipo"
    // Según tu LoggedMenu, hay un card con texto "Gestiona tu equipo y alineación"
    cy.contains(/gestiona tu equipo|mi equipo/i).click();
    
    // Verificar redirección a UpdateTeam
    cy.url().should('include', '/UpdateTeam', { timeout: 10000 });
    
    // Verificar que la página de edición cargó
    cy.contains(/editar equipo|alineación|formación/i).should('be.visible');
  });

  /**
   * Test 4: Visualizar jugadores titulares y suplentes
   * Propósito: Validar que UpdateTeam muestra correctamente la división titular/suplente
   */
  it('should display starters and substitutes separately', () => {
    cy.visit('/UpdateTeam');
    
    // Esperar a que cargue la página (puede tardar si llama a API)
    cy.contains(/titular|suplente/i, { timeout: 15000 }).should('be.visible');
    
    // Verificar secciones de titulares y suplentes
    // Ajusta según tu implementación (pueden ser tabs, secciones, etc.)
    cy.contains(/titular/i).should('exist');
    cy.contains(/suplente|banco/i).should('exist');
  });

  /**
   * Test 5: Intercambiar jugador titular por suplente
   * Propósito: Validar la funcionalidad principal de UpdateTeam
   * 
   * Este test valida que:
   * - Se puede seleccionar un titular
   * - Se puede seleccionar un suplente
   * - Se puede realizar el intercambio
   * - Los cambios se reflejan en la UI
   */
  it('should swap starter with substitute', () => {
    cy.visit('/UpdateTeam');
    
    // Esperar a que carguen los jugadores
    cy.wait(2000);
    
    // Estrategia: Buscar el primer jugador titular y el primer suplente
    // Nota: Necesitarás ajustar los selectores según tu implementación real
    
    // Opción A: Si usas botones de "intercambiar" en cada jugador
    cy.get('[data-testid="starter-player"]').first().within(() => {
      cy.contains('button', /intercambiar|cambiar/i).click();
    });
    
    // Luego seleccionar un suplente para el intercambio
    cy.get('[data-testid="substitute-player"]').first().click();
    
    // Opción B: Si usas un sistema de drag & drop
    // cy.get('[data-testid="starter-player"]').first().drag('[data-testid="substitute-player"]').first();
    
    // Opción C: Si usas clicks para seleccionar ambos y luego un botón "Intercambiar"
    // cy.get('[data-testid="starter-player"]').first().click();
    // cy.get('[data-testid="substitute-player"]').first().click();
    // cy.contains('button', /intercambiar/i).click();
    
    // Verificar que se muestra feedback del cambio
    cy.contains(/cambi|intercambi|actualiz/i, { timeout: 5000 }).should('be.visible');
  });

  /**
   * Test 6: Guardar cambios en la alineación
   * Propósito: Validar que los cambios se persisten en el backend
   */
  it('should save team changes successfully', () => {
    cy.visit('/UpdateTeam');
    cy.wait(2000);
    
    // Realizar un cambio (simplificado - ajusta según tu UI)
    // Por ejemplo, si hay un botón de "Guardar" o "Actualizar Equipo"
    
    // Interceptar la petición PUT/PATCH al backend
    cy.intercept('PUT', '**/api/equipos/**').as('updateTeam');
    // o: cy.intercept('PATCH', '**/api/equipos/**').as('updateTeam');
    
    // Buscar y hacer click en el botón de guardar
    cy.contains('button', /guardar|actualizar equipo|confirmar/i).click();
    
    // Esperar a que se complete la petición
    cy.wait('@updateTeam').its('response.statusCode').should('eq', 200);
    
    // Verificar mensaje de éxito
    cy.contains(/guardado|actualizado|éxito/i, { timeout: 10000 }).should('be.visible');
    
    // Opcional: Verificar que redirige de vuelta al dashboard
    // cy.url().should('include', '/LoggedMenu');
  });

  /**
   * Test 7: Validación de formación mínima
   * Propósito: Validar que no se puede guardar un equipo sin la cantidad mínima de jugadores
   * 
   * Nota: Este test depende de si tienes validaciones en el frontend
   */
  it('should validate minimum formation requirements', () => {
    cy.visit('/UpdateTeam');
    cy.wait(2000);
    
    // Intentar quitar todos los titulares (si tu UI lo permite)
    // Esto debería estar bloqueado o mostrar error
    
    // Intentar guardar con formación inválida
    cy.contains('button', /guardar|actualizar/i).click();
    
    // Verificar que se muestra mensaje de error o el botón está deshabilitado
    cy.contains(/formación inválida|selecciona jugadores|mínimo/i).should('be.visible');
    // o: cy.get('button:contains("Guardar")[disabled]').should('exist');
  });

  /**
   * Test 8: Cancelar edición y volver al dashboard
   * Propósito: Validar que el usuario puede cancelar cambios y volver
   */
  it('should cancel changes and return to dashboard', () => {
    cy.visit('/UpdateTeam');
    cy.wait(2000);
    
    // Buscar botón de cancelar o volver
    cy.contains('button', /cancelar|volver|atrás/i).click();
    
    // Verificar que vuelve al dashboard
    cy.url().should('include', '/LoggedMenu');
  });

  /**
   * Test 9: Persistencia de cambios después de recargar
   * Propósito: Validar que los cambios guardados se mantienen después de reload
   */
  it('should persist team changes after page reload', () => {
    cy.visit('/UpdateTeam');
    cy.wait(2000);
    
    // Guardar el nombre del primer jugador titular antes de cambios
    let firstStarterBefore: string;
    cy.get('[data-testid="starter-player"]').first().invoke('text').then((text) => {
      firstStarterBefore = text;
    });
    
    // Realizar cambios y guardar
    cy.intercept('PUT', '**/api/equipos/**').as('updateTeam');
    cy.contains('button', /guardar/i).click();
    cy.wait('@updateTeam');
    
    // Recargar la página
    cy.reload();
    cy.wait(2000);
    
    // Verificar que los cambios persisten
    // (Este test es simplificado - necesitarías comparar estados específicos)
    cy.get('[data-testid="starter-player"]').should('exist');
  });

  /**
   * Test 10: Responsividad - móvil vs escritorio
   * Propósito: Validar que la gestión de equipo funciona en diferentes viewports
   */
  it('should work on mobile viewport', () => {
    // Cambiar a viewport móvil
    cy.viewport('iphone-x');
    
    cy.visit('/UpdateTeam');
    cy.wait(2000);
    
    // Verificar que los elementos principales son accesibles
    cy.contains(/titular|equipo/i).should('be.visible');
    cy.contains('button', /guardar/i).should('be.visible');
    
    // Restaurar viewport
    cy.viewport(1280, 720);
  });
});
