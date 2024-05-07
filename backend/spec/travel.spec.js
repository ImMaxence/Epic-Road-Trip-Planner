const app = require('./../app');

const axios = require('axios');

var base_url = "http://localhost:8080/api/travel/allTravelAndUser"

describe("routes travel", function () {
 
    it('Ajouter un voyage', (done) => {
        axios.post('http://localhost:8080/api/users/register', {
            username: "testVoyage",
            email: "test.voyage@example.com",
            password: "password123"
        })
        .then(response => {
            axios.post('http://localhost:8080/api/travel/addTravel', {
                "idUser": response.data.id,
                "titre":"titre",
                "travel":"VOYAGE",
                "photoProfil":1,
                "dateCreation":"2024-04-16 12:21:46",
                "villeDepart":"123444.89",
                "villeFin":"123444.89"
            }, {
                headers: {
                    "x-access-token": response.data.accessToken
                }
            })
            .then(response => {
                // Assurez-vous que la réponse a un code d'état 200
                expect(response.status).toBe(200);
                console.log("Le test de création d'un voyage à réussi !");
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
    });

});