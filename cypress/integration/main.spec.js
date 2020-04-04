describe('Bulk GIF Edit Mode', function() {
  it('loads the main gif', function() {
    cy.visit('/');

    cy.get('#use-gif').click()

    cy.get("#playback-controls").should('be.visible');
  });

  it('can control playback of loaded gif', function() {
    cy.visit('/');

    cy.get('#use-gif').click();

    cy.get("#playback-controls").should('be.visible');

    cy.get("#stop-preview-gif").click();

    let frameNumber = null;
    cy.get("#frame-number").then($frame => {
      frameNumber = $frame.text();
    });

    cy.get("#frame-number").then($frame =>
      expect($frame.text()).to.equal(frameNumber)
    );

    cy.get("#prev-gif").click();

    cy.get("#frame-number").then($frame =>
      expect($frame.text()).to.not.equal(frameNumber)
    );

    cy.get("#next-gif").click();

    cy.get("#frame-number").then($frame =>
      expect($frame.text()).to.equal(frameNumber)
    );

    cy.get("#preview-gif").click();
  });

  it('can generate a gif', function() {
    cy.visit('/');

    cy.get('#use-gif').click();

    cy.get("#playback-controls").should('be.visible');

    cy.get("#output-gif").should('not.be.visible');

    cy.get("#render-gif").click();

    cy.get("#output-gif")
      .should('be.visible')
      .then($img => {
        const imgSrc = $img[0].src;
        expect(imgSrc).to.match(/blob\:.*/);
      });
  });

  // it('loads the main page', function() {
  //   cy.visit('/');

  //   cy.get('#use-gif').click()

  //   cy.get("#playback-controls").should('be.visible');
  // });
});
