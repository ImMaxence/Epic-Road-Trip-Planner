
const axios = require('axios');


describe("gouv API", function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    it('Ajouter un voyage', (done) => {
        axios.get('https://www.datatourisme.fr/')
        .then(response => {
            expect(response.status).toBe(200);
            console.log("gouve OK")
            done()
        })
        .catch(error => {
            console.log("error",error)

            // fail("Le test a échoué : " + error.response.data.message);
            // En cas d'erreur, signalez-la
            done.fail();
            
        });
    });

});