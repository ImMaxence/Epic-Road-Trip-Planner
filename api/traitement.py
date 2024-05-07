from datetime import datetime
import json
from numpy import sin, cos, arccos, pi, round
import pandas as pd

def drink(latitude, longitude, condition) -> json:
    # data = filtre(r"result\drink.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    data = filtre(r"result/drink.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    return data

def eat(latitude, longitude, condition) -> json:
    # data = filtre(r"result\eat.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    data = filtre(r"result/eat.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    return data

def sleep(latitude, longitude, condition) -> json:
    # data = filtre(r"result\sleep.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    data = filtre(r"result/sleep.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    return data

def enjoy(latitude, longitude, condition) -> json:
    # data = filtre(r"result\enjoy.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    data = filtre(r"result/enjoy.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    return data

def travel(latitude, longitude, condition) -> json:
    # data = filtre(r"result\travel.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    data = filtre(r"result/travel.json", latitude, longitude, condition["distance_max"], condition["date_min"], condition["date_max"])
    return data

def filtre(source, latitude, longitude, distance_max, date_min, date_max):
    with open(source, 'r') as f:
        data = json.load(f)

    df = pd.DataFrame(data)
    df['distance'] = df.apply(lambda row: getDistanceBetweenPointsNew(float(row["latitude"]), float(row["longitude"]), float(latitude), float(longitude)), axis=1)
    df['date_debut'] = pd.to_datetime(df['date_debut'], errors='coerce')
    df['date_fin'] = pd.to_datetime(df['date_fin'], errors='coerce')

    if distance_max:
        df_filtered = df[df['distance'] <= int(distance_max)] 
    else:
        df_filtered = df.copy()
    if date_min:
        date_min = pd.to_datetime(date_min, format="%d/%m/%Y")
        df_filtered = df_filtered[df_filtered['date_debut'].fillna(pd.Timestamp.min) >= date_min]

    if date_max:
        date_max = pd.to_datetime(date_max, format="%d/%m/%Y")
        df_filtered = df_filtered[df_filtered['date_fin'].fillna(pd.Timestamp.max) <= date_max]

    df_missing_values = df_filtered[df_filtered['date_debut'].isna() | df_filtered['date_fin'].isna()]

    df_result = pd.concat([df_filtered, df_missing_values], ignore_index=True)

    df_result['date_debut'] = df_result['date_debut'].dt.strftime("%d/%m/%Y %H:%M:%S")
    df_result['date_fin'] = df_result['date_fin'].dt.strftime("%d/%m/%Y %H:%M:%S")

    result_json = df_result.replace(pd.NaT, "Non défini").to_json(orient='records')

    return result_json


def rad2deg(radians):
    degrees = radians * 180 / pi
    return degrees

def deg2rad(degrees):
    radians = degrees * pi / 180
    return radians

def getDistanceBetweenPointsNew(latitude1, longitude1, latitude2, longitude2):
    
    theta = longitude1 - longitude2
    
    distance = 60 * 1.1515 * rad2deg(
        arccos(
            (sin(deg2rad(latitude1)) * sin(deg2rad(latitude2))) + 
            (cos(deg2rad(latitude1)) * cos(deg2rad(latitude2)) * cos(deg2rad(theta)))
        )
    )
    return round(distance * 1.609344, 2)