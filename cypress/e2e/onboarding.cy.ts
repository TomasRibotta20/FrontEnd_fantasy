/**
 * Tests E2E para el flujo de onboarding
 * 
 * Este archivo prueba el journey completo de un nuevo usuario:
 * Registro → Login automático → Creación de equipo → Dashboard con equipo
 * 
 * Este es uno de los flujos más críticos porque es la primera experiencia del usuario
 */

describe('Onboarding Flow', () => {
  beforeEach(() => {
    // Limpiar estado antes de cada test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  /**
   * Test 1: Flujo completo de onboarding (Happy Path)
   * Este es el test más importante - valida toda la experiencia del nuevo usuario
   * 
   * Pasos del flujo:
   * 1. Usuario se registra en la plataforma
   * 2. Sistema hace login automático
   * 3. Usuario es redirigido al dashboard
   * 4. Dashboard detecta que no tiene equipo
   * 5. Usuario es llevado a crear su equipo
   * 6. Sistema genera 25 jugadores aleatorios para el equipo
   * 7. Usuario completa la creación del equipo
   * 8. Usuario ve su equipo en el dashboard
   */
  it('should complete full onboarding: register → auto-login → create team → dashboard', () => {
    // Crear usuario único para este test específico
    const newUser = {
      username: `onboard_${Date.now()}`,
      email: `onboard_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };
    
    // PASO 1: Registro (automáticamente redirige a CreateTeam)
    cy.register(newUser.username, newUser.email, newUser.password);
    
    // PASO 2: Verificar que redirigió directamente a CreateTeam (porque no tiene equipo)
    cy.url().should('include', '/CreateTeam', { timeout: 10000 });
    
    // PASO 3: Verificar que está en la página de crear equipo
    cy.contains(/crea tu equipo|crear equipo/i, { timeout: 10000 }).should('be.visible');
    
    // PASO 4: Completar el formulario de creación de equipo
    // Buscar el input que tiene el placeholder "Ingresa el nombre de tu equipo"
    cy.get('input[placeholder*="nombre"]', { timeout: 10000 }).should('be.visible').type('Mi Primer Equipo');
    
    // PASO 5: Hacer click en el botón "Crear" (el texto cambia dinámicamente con el nombre del equipo)
    cy.contains('button', /crear/i).click();
    
    // PASO 6: Esperar a que se generen los 25 jugadores y se cree el equipo
    // Esto puede tardar porque llama a API externa
    cy.wait(5000);
    
    // PASO 7: Verificar redirección al dashboard con equipo creado
    cy.url().should('include', '/LoggedMenu', { timeout: 20000 });
  });

  /**
   * Test 2: Redirección automática cuando no hay equipo
   * Propósito: Validar que el sistema detecta usuarios sin equipo y los redirige
   * 
   * Esto es importante para guiar al usuario en su primer uso
   */
  it('should redirect to CreateTeam when user has no team', () => {
    // Crear usuario único para este test
    const newUser = {
      username: `noTeam_${Date.now()}`,
      email: `noTeam_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };
    
    // Registrar usuario (esto ya crea la cuenta y redirige a CreateTeam porque no tiene equipo)
    cy.register(newUser.username, newUser.email, newUser.password);
    
    // Verificar que está en CreateTeam automáticamente (puede ser /CreateTeam o /crear-equipo)
    cy.url().should('match', /\/(CreateTeam|crear-equipo)/, { timeout: 10000 });
    
    // Ahora intentar navegar a LoggedMenu
    cy.visit('/LoggedMenu');
    
    // Debería redirigir de vuelta a CreateTeam porque no tiene equipo
    cy.url().should('match', /\/(CreateTeam|crear-equipo)/, { timeout: 10000 });
  });

  /**
   * Test 3: Usuario con equipo NO es redirigido a CreateTeam
   * Propósito: Validar que usuarios existentes con equipo van directo al dashboard
   */
  it('should NOT redirect to CreateTeam when user already has a team', () => {
    // Crear usuario único para este test
    const newUser = {
      username: `hasTeam_${Date.now()}`,
      email: `hasTeam_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };
    
    // Registrar y crear equipo completo
    cy.register(newUser.username, newUser.email, newUser.password);
    cy.url().should('include', '/CreateTeam');
    
    // Crear el equipo
    cy.get('input[placeholder*="nombre"]', { timeout: 10000 }).should('be.visible').type('Equipo de Prueba');
    cy.contains('button', /crear/i).click();
    cy.wait(5000);
    
    // Verificar que redirige a LoggedMenu después de crear equipo
    cy.url().should('include', '/LoggedMenu', { timeout: 20000 });
    
    // Ahora que tiene equipo, si hace logout y vuelve a hacer login, debe ir a LoggedMenu
    cy.logout();
    
    // Hacer login de nuevo
    cy.visit('/login');
    cy.get('input[name="email"]').type(newUser.email);
    cy.get('input[name="password"]').type(newUser.password);
    cy.get('button[type="submit"]').click();
    
    // Verificar que va a LoggedMenu (NO a CreateTeam) porque ya tiene equipo
    cy.url().should('include', '/LoggedMenu', { timeout: 15000 });
    cy.url().should('not.include', '/CreateTeam');
  });

  /**
   * Test 4: Validación del nombre de equipo requerido
   * Propósito: Verificar que no se puede crear equipo sin nombre
   */
  it('should require team name to create team', () => {
    // Crear usuario único para este test
    const newUser = {
      username: `reqName_${Date.now()}`,
      email: `reqName_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };
    
    cy.register(newUser.username, newUser.email, newUser.password);
    
    // Ya está en CreateTeam después del registro
    cy.url().should('match', /\/(CreateTeam|crear-equipo)/);
    
    // Verificar que el botón está deshabilitado cuando no hay nombre
    cy.contains('button', /crear/i).should('be.disabled');
    
    // Escribir algo en el input
    cy.get('input[placeholder*="nombre"]').type('Mi Equipo');
    
    // Ahora el botón debe estar habilitado
    cy.contains('button', /crear/i).should('not.be.disabled');
  });

  /**
   * Test 5: Loading state durante la creación del equipo
   * Propósito: Validar que se muestra feedback visual mientras se crea el equipo
   * 
   * Esto mejora UX - el usuario sabe que algo está pasando
   */
  it('should show loading state while creating team', () => {
    // Crear usuario único para este test
    const newUser = {
      username: `loading_${Date.now()}`,
      email: `loading_${Date.now()}@example.com`,
      password: 'NewUser123!',
    };
    
    cy.register(newUser.username, newUser.email, newUser.password);
    cy.url().should('match', /\/(CreateTeam|crear-equipo)/);
    
    cy.get('input[placeholder*="nombre"]').type('Equipo Test Loading');
    
    // Interceptar la creación para hacerla más lenta y poder ver el loading
    cy.intercept('POST', '**/api/equipos', (req) => {
      req.reply((res) => {
        res.delay = 2000; // Delay de 2 segundos
        return res;
      });
    }).as('createTeam');
    
    cy.contains('button', /crear/i).click();
    
    // Verificar que se muestra un indicador de loading
    // Esto puede ser un spinner, texto "Creando...", botón deshabilitado, etc.
    cy.get('button[disabled]').should('exist');
    // O: cy.contains(/creando|cargando/i).should('be.visible');
    
    cy.wait('@createTeam');
  });
});
