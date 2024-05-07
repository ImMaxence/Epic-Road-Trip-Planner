from flask import Flask
from flask import request

from traitement import * 

app = Flask(__name__)


@app.route('/')
def API():
    return 'API créée à partir de la donnée provenant de DataTourisme !'

@app.route('/api/drink')
def drinkRoute():
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    conditions = request.args.get('condition')

    conditions_dict = {}
    if conditions:
        try:
            conditions_dict = json.loads(conditions)
        except json.JSONDecodeError:
            pass

    drinkData =  drink(latitude, longitude, conditions_dict)
    return drinkData

@app.route('/api/eat')
def eatRoute():
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    conditions = request.args.get('condition')

    conditions_dict = {}
    if conditions:
        try:
            conditions_dict = json.loads(conditions)
        except json.JSONDecodeError:
            pass

    eatData =  eat(latitude, longitude, conditions_dict)
    return eatData

@app.route('/api/enjoy')
def enjoyRoute():
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    conditions = request.args.get('condition')

    conditions_dict = {}
    if conditions:
        try:
            conditions_dict = json.loads(conditions)
        except json.JSONDecodeError:
            pass

    enjoyData =  enjoy(latitude, longitude, conditions_dict)
    return enjoyData

@app.route('/api/sleep')
def sleepRoute():
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    conditions = request.args.get('condition')

    conditions_dict = {}
    if conditions:
        try:
            conditions_dict = json.loads(conditions)
        except json.JSONDecodeError:
            pass

    sleepData =  sleep(latitude, longitude, conditions_dict)
    return sleepData

@app.route('/api/travel')
def travelRoute():
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    conditions = request.args.get('condition')

    conditions_dict = {}
    if conditions:
        try:
            conditions_dict = json.loads(conditions)
        except json.JSONDecodeError:
            pass

    travelDate =  travel(latitude, longitude, conditions_dict)
    return travelDate