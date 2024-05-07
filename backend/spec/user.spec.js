
// Importez votre application Express
const app = require('./../app');

const axios = require('axios');

describe('Test de la route API pour user', () => {
    it('Devrait retourner un code 200', (done) => {
        axios.post('http://localhost:8080/api/users/register', {
            username: "martin",
            email: "martin.mystere@example.com",
            password: "password123"
        })
        .then(response => {
            // Assurez-vous que la réponse a un code d'état 200
            expect(response.status).toBe(200);
            
            // Ajoutez vos attentes ici
            expect(response.data.username).toEqual('martin');
            expect(response.data.email).toEqual('martin.mystere@example.com');
            // Assurez-vous que le mot de passe n'est pas renvoyé dans la réponse
            expect(response.data.password).not.toBeDefined();
            console.log("Le test de création d'utilisateur a réussi !");
            done();
        })
        .catch(error => {
            fail("Le test a échoué : " + error.response.data.message);
            // En cas d'erreur, signalez-la
            done.fail();
            
        });
    });

    it("connexion user ", function (done) {
        axios.post('http://localhost:8080/api/users/register', {
            username: "fraise",
            email: "fraise.banane@example.com",
            password: "password123"
        })
        .then(response => {
            axios.post('http://localhost:8080/api/users/login', {
                email: "fraise.banane@example.com",
                password: "password123"
            })
            .then(response => {
                // Assurez-vous que la réponse a un code d'état 200
                expect(response.status).toBe(200);
                
                // Ajoutez vos attentes ici
                expect(response.data.username).toEqual('fraise');
                expect(response.data.email).toEqual('fraise.banane@example.com');
                // Assurez-vous que le mot de passe n'est pas renvoyé dans la réponse
                console.log("Le test de connexion d'utilisateur a réussi !");
                done();
            })
            .catch(error => {
                fail("Le test a échoué : " + error.response.data.message);
                // En cas d'erreur, signalez-la
                done.fail();
                
        });
        })
        .catch(error => {
            fail("Le test a échoué : " + error.response.data.message);
            // En cas d'erreur, signalez-la
            done.fail();
            
        });


})
  
});
