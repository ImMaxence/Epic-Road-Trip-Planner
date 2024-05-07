import requests
import zipfile
import io
import schedule
import time
import os
from dotenv import load_dotenv

from filtrer import * 

load_dotenv("../.env.python")

api_key = os.getenv("API_KEY")
url_data = os.getenv("URL_DATA")

# https://schedule.readthedocs.io/en/stable/examples.html#run-a-job-every-x-minute
# https://requests.readthedocs.io/en/latest/


API_KEY = api_key
URL = url_data
URL_UPLOAD = str(URL) + str(API_KEY)



def telecharger_et_extraire_zip(url, destination):
    response = requests.get(url)
    if response.status_code == 200:
        with zipfile.ZipFile(io.BytesIO(response.content), 'r') as zip_ref:
            zip_ref.extractall(destination)
        print("Téléchargement et extraction terminés avec succès.")
    else:
        print("Échec du téléchargement. Code de statut :", response.status_code)

def filterData():
    print("Filtrage de la base de données...")
    filtrer_donnees()
    print("Filtrage terminé avec succès.")

def telecharger_periodiquement():
    print("Téléchargement de la base de données...")
    destination = 'data'  
    telecharger_et_extraire_zip(URL_UPLOAD, destination)
    print("Filtrage des donnes...")
    filterData()


telecharger_periodiquement()


#schedule.every(1).minutes.do(telecharger_periodiquement)
schedule.every(2).days.do(telecharger_periodiquement)
#schedule.every(240).minutes.do(telecharger_periodiquement)

# Boucle d'exécution pour vérifier régulièrement s'il y a des tâches à exécuter
while True:
    schedule.run_pending()
