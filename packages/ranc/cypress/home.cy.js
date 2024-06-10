import { cy, describe, it } from 'cypress'

describe('The Home Page', () => {
    it('successfully loads', () => {
        cy.visit('http://localhost:5175') // change URL to match your dev URL
    })
})