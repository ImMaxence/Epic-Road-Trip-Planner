require('dotenv').config();

const axios = require('axios');
const { getCurrentDate, getNextWeekDate } = require('./dateUtils');

exports.travelGet = async (req, res) => {
    if (!req.query.latitude || !req.query.longitude) {
        return res.status(400).json({ message: 'Latitude et longitude sont obligatoires.' });
    }
    try {
        let { latitude, longitude, condition } = req.query;
        if (!condition) {
            condition = {
                distance_max: '100',
                date_min: getCurrentDate(),
                date_max: getNextWeekDate()
            };
        } else {
            condition = JSON.parse(condition);
            condition.distance_max = condition.distance_max || '100';
            condition.date_min = condition.date_min || getCurrentDate();
            condition.date_max = condition.date_max || getNextWeekDate();
        }
        console.log(condition)
        const conditionParams = encodeURIComponent(JSON.stringify(condition));
        const apiUrl = `${process.env.ENDPOINT_API_PYTHON}api/travel?latitude=${latitude}&longitude=${longitude}&condition=${conditionParams}`;
        console.log(apiUrl)
        const response = await axios.get(apiUrl);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Une erreur est survenue lors de la récupération des données de l\'api externe.' });
    }
};