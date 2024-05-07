const axios = require('axios');
const app = require('./../app');
var base_url = "http://localhost:8080/api/enjoy/get"

describe("enjoy", function () {
    it('get enjoy', (done) => {
        
        axios.get('http://localhost:8080/api/enjoy/get?latitude=43.455198&longitude=5.479170')
        .then(response => {
            // Assurez-vous que la réponse a un code d'état 200
            expect(response.status).toBe(200);
            console.log("get enjoy OK");
            done();
        })
        .catch(error => {
            fail("Le test a échoué : " + error.response.data.message);
            // En cas d'erreur, signalez-la
            console.log('erruer sleep')

            done.fail();
            
        });
     
    });

});