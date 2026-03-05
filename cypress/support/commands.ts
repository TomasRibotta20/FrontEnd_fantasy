/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user.
       * Usa cy.session() para cachear cookies y evitar repetir el login en cada test.
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to register a new user.
       * Después del registro la app hace auto-login y redirige a /torneos.
       * @example cy.register('newuser', 'user@test.com', 'password123')
       */
      register(
        username: string,
        email: string,
        password: string
      ): Chainable<void>;

      /**
       * Custom command to logout the current user.
       * Hace click en el menú de usuario del navbar y luego en "Cerrar Sesión".
       * @example cy.logout()
       */
      logout(): Chainable<void>;
    }
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');

    cy.get('input[name="email"]', { timeout: 10000 })
      .should('be.visible')
      .type(email);
    cy.get('input[name="password"]').should('be.visible').type(password);
    cy.get('button[type="submit"]').click();

    // Después del login el usuario va a:
    //   • /admin           (si es admin)
    //   • /LoggedMenu?…    (si tiene torneos)
    //   • /torneos          (si no tiene torneos)
    cy.url().should('match', /\/(admin|LoggedMenu|torneos)/, { timeout: 15000 });
  });
});

// ─── Register ─────────────────────────────────────────────────────────────────
Cypress.Commands.add(
  'register',
  (username: string, email: string, password: string) => {
    cy.visit('/CreateUser');

    cy.get('input[name="name"]', { timeout: 10000 })
      .should('be.visible')
      .type(username);
    cy.get('input[name="email"]').should('be.visible').type(email);
    cy.get('input[name="password"]').should('be.visible').type(password);
    cy.get('button[type="submit"]').click();

    // La app hace auto-login y redirige a /torneos
    cy.url().should('include', '/torneos', { timeout: 15000 });
  }
);

// ─── Logout ───────────────────────────────────────────────────────────────────
Cypress.Commands.add('logout', () => {
  // El menú de usuario está en el navbar (HeadlessUI Menu).
  // El Menu.Button muestra el username del usuario.
  // Abrimos el dropdown haciendo click en ese botón.
  cy.get('nav', { timeout: 10000 }).within(() => {
    // Filtramos los botones de navegación principal para quedarnos con el del usuario
    cy.get('button')
      .filter(':not(:contains("Torneos"))')
      .filter(':not(:contains("Equipo"))')
      .filter(':not(:contains("Jornada"))')
      .filter(':not(:contains("Mercado"))')
      .filter(':not(:contains("Mis Ofertas"))')
      .filter(':not(:contains("Iniciar Sesión"))')
      .filter(':not(:contains("Registrarse"))')
      .last()
      .click();
  });

  // Click en "Cerrar Sesión" en el dropdown
  cy.contains('button', /cerrar sesión/i, { timeout: 5000 }).click();

  // Según el flujo real, puede terminar en "/login" (actual) o "/".
  cy.url().should('match', /\/(login)?$/, { timeout: 10000 });
});

export {};