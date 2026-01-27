/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to register a new user
       * @example cy.register('newuser', 'user@test.com', 'password123')
       */
      register(username: string, email: string, password: string): Chainable<void>
      
      /**
       * Custom command to create a team for the logged user
       * @example cy.createTeam('Dream Team', [1, 2, 3, 4, 5])
       */
      createTeam(teamName: string, playerIds?: number[]): Chainable<void>
      
      /**
       * Custom command to logout the current user
       * @example cy.logout()
       */
      logout(): Chainable<void>
    }
  }
}


Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type(email);
    cy.get('input[name="password"]').should('be.visible').type(password);
    cy.get('button[type="submit"]').click();
    
    // Esperar a que la redirección se complete
    // Puede ir a /LoggedMenu o /CreateTeam dependiendo si tiene equipo
    cy.url().should('match', /\/(LoggedMenu|CreateTeam)/, { timeout: 15000 });
  });
});

Cypress.Commands.add('register', (username: string, email: string, password: string) => {
  cy.visit('/CreateUser');
  cy.get('input[name="name"]', { timeout: 10000 }).should('be.visible').type(username);
  cy.get('input[name="email"]').should('be.visible').type(email);
  cy.get('input[name="password"]').should('be.visible').type(password);
  cy.get('button[type="submit"]').click();
  
  // Después del registro, la app redirige automáticamente a CreateTeam
  cy.url().should('include', '/CreateTeam', { timeout: 15000 });
});

Cypress.Commands.add('createTeam', (teamName: string, playerIds?: number[]) => {
  cy.visit('/CreateTeam');
  cy.get('input[name="teamName"]').type(teamName);
  
  if (playerIds && playerIds.length > 0) {
    // Si se proporcionan IDs de jugadores, seleccionarlos
    playerIds.forEach((playerId) => {
      cy.get(`[data-player-id="${playerId}"]`).click();
    });
  }
  
  cy.contains('button', 'Crear Equipo').click();
  cy.url().should('include', '/LoggedMenu');
});

Cypress.Commands.add('logout', () => {
  // Esperar a que la página esté completamente cargada
  cy.wait(500);
  
  // Buscar el elemento del usuario en la navbar (esquina superior derecha)
  // Tu navbar muestra el username, no el email
  cy.get('nav').within(() => {
    // Buscar cualquier elemento que contenga "Team", "user", "loading", "test" o números
    // Esto captura: "noTeam_1764949318775", "testuser_1234", etc.
    cy.contains(/Team_|user_|test|loading_|\d{13}/i, { timeout: 10000 }).click();
  });
  
  // Click en "Cerrar Sesión" dentro del dropdown
  cy.contains(/cerrar sesión/i, { timeout: 5000 }).click();
  
  // Verificar redirección a página pública (puede ser / o /login)
  cy.url().should('match', /\/(login)?$/, { timeout: 10000 });
});

export {};