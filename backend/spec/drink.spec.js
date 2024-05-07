const axios = require('axios');
const app = require('./../app');
var base_url = "http://localhost:8080/api/drink/get"

describe("drink", function () {
    it('get drink', (done) => {
        axios.post('http://localhost:8080/api/users/register', {
            username: "testDrink",
            email: "test.drink@example.com",
            password: "password123"
        })
        .then(response => {
            axios.get('http://localhost:8080/api/drink/get?latitude=43.455198&longitude=5.479170',{
                headers: {
                    "x-access-token": response.data.accessToken
                }
            })
            .then(response => {
                // Assurez-vous que la réponse a un code d'état 200
                expect(response.status).toBe(200);
                console.log("get drink OK");
                done();
            })
            .catch(error => {
                fail("Le test a échoué : " + error.response.data.message);
                // En cas d'erreur, signalez-la
                console.log('erruer drink')

                done.fail();
                
            });
        })
        .catch(error => {
            // fail("Le test a échoué : " + error.response.data.message);
            // En cas d'erreur, signalez-la
            console.log('erruer user', error)
            done.fail();
            
        });
    });

});