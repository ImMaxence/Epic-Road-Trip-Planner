const axios = require('axios');
const app = require('./../app');
var base_url = "http://localhost:8080/api/sleep/get"

describe("sleep", function () {
    it('get sleep', (done) => {
        axios.post('http://localhost:8080/api/users/register', {
            username: "testSleep",
            email: "test.sleep@example.com",
            password: "password123"
        })
        .then(response => {
            axios.get('http://localhost:8080/api/sleep/get?latitude=43.455198&longitude=5.479170',{
                headers: {
                    "x-access-token": response.data.accessToken
                }
            })
            .then(response => {
                // Assurez-vous que la réponse a un code d'état 200
                expect(response.status).toBe(200);
                console.log("get sleep OK");
                done();
            })
            .catch(error => {
                fail("Le test a échoué : " + error.response.data.message);
                // En cas d'erreur, signalez-la
                console.log('erruer sleep')

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