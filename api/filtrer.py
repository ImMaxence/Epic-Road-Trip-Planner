import json
import os
import math

def filtrer_donnees():
    # =====
    # Définition
    # =====
    with open(r"filtre/sleep.json", encoding='utf-8') as user_file:
        array_sleep = json.load(user_file)
    with open(r"filtre/eat.json", encoding='utf-8') as user_file:
        array_eat = json.load(user_file)
    with open(r"filtre/drink.json", encoding='utf-8') as user_file:
        array_drink = json.load(user_file)
    with open(r"filtre/travel.json", encoding='utf-8') as user_file:
        array_travel = json.load(user_file)
    with open(r"filtre/enjoy.json", encoding='utf-8') as user_file:
        array_enjoy = json.load(user_file)

    result_sleep = []
    result_eat = []
    result_drink = []
    result_travel = []
    result_enjoy = []

    # =====
    # Fonction pour obtenir tous les fichiers json du .zip
    # =====
    def trouver_fichiers(dossier):
        fichiers = []
        for root, dirs, files in os.walk(dossier):
            for file in files:
                fichiers.append(os.path.join(root, file))
        return fichiers

    def getDataClean(file_contents):
        # {
        #     "nom_activite": file_contents["rdfs:label"]["fr"][0],
        #     "date_debut": (file_contents["takesPlaceAt"][0]["startDate"] if 'startDate' in file_contents["takesPlaceAt"][0].keys() else "") + (" " + file_contents["takesPlaceAt"][0]["startTime"] if 'startTime' in file_contents["takesPlaceAt"][0].keys() else "") if "takesPlaceAt" in file_contents.keys() else "",
        #     "date_fin": (file_contents["takesPlaceAt"][0]["endDate"] if 'endDate' in file_contents["takesPlaceAt"][0].keys() else "") + (" " + file_contents["takesPlaceAt"][0]["endTime"] if 'endTime' in file_contents["takesPlaceAt"][0].keys() else "") if "takesPlaceAt" in file_contents.keys() else "",
        #     "price": ((file_contents["offers"][0]["schema:priceSpecification"][0]["schema:minPrice"] if "schema:minPrice" in file_contents["offers"][0]["schema:priceSpecification"][0].keys() else "") if 'schema:priceSpecification' in file_contents["offers"][0].keys() else "") if 'offers' in file_contents.keys() else "" + (( "-" + file_contents["offers"][0]["schema:priceSpecification"][0]["schema:maxPrice"] if "schema:maxPrice" in file_contents["offers"][0]["schema:priceSpecification"][0].keys() else "") if 'schema:priceSpecification' in file_contents["offers"][0].keys() else "") if 'offers' in file_contents.keys() else ""
        # }
        date_debut = ""
        date_fin = ""
        price = ""
        audiance = ""
        longitude = ""
        latitude = ""
        image = ""
        description = ""
        email = ""
        telephone = []
        siteweb = ""
        data = {}
        if "takesPlaceAt" in file_contents.keys():
            if "startDate" in file_contents["takesPlaceAt"][0].keys():
                date_debut += file_contents["takesPlaceAt"][0]["startDate"]
            if "startTime" in file_contents["takesPlaceAt"][0].keys():
                date_debut += " " + file_contents["takesPlaceAt"][0]["startTime"]
            if "endDate" in file_contents["takesPlaceAt"][0].keys():
                date_fin += file_contents["takesPlaceAt"][0]["endDate"]
            if "endTime" in file_contents["takesPlaceAt"][0].keys():
                date_fin += " " + file_contents["takesPlaceAt"][0]["endTime"]
        if "offers" in file_contents.keys():
            if "schema:priceSpecification" in file_contents["offers"][0].keys():
                if "schema:minPrice" in file_contents["offers"][0]["schema:priceSpecification"][0].keys():
                    price += file_contents["offers"][0]["schema:priceSpecification"][0]["schema:minPrice"][0] + '€'
                if "schema:maxPrice" in file_contents["offers"][0]["schema:priceSpecification"][0].keys():
                    if len(price) > 0:
                        price += "-"
                    price += file_contents["offers"][0]["schema:priceSpecification"][0]["schema:maxPrice"][0] + '€'
                if "hasAudience" in  file_contents["offers"][0]["schema:priceSpecification"][0].keys():
                    if "rdfs:label" in  file_contents["offers"][0]["schema:priceSpecification"][0]["hasAudience"][0].keys():
                        audiance += file_contents["offers"][0]["schema:priceSpecification"][0]["hasAudience"][0]["rdfs:label"]["fr"][0] 
        if "isLocatedAt" in file_contents.keys():
            if "schema:geo" in file_contents["isLocatedAt"][0].keys():
                if "schema:latitude" in file_contents["isLocatedAt"][0]["schema:geo"].keys():
                    latitude += file_contents["isLocatedAt"][0]["schema:geo"]["schema:latitude"]
                if "schema:longitude" in file_contents["isLocatedAt"][0]["schema:geo"].keys():
                    longitude += file_contents["isLocatedAt"][0]["schema:geo"]["schema:longitude"]
        if "hasRepresentation" in file_contents.keys():
            if "ebucore:hasRelatedResource" in file_contents["hasRepresentation"][0].keys():
                if "ebucore:locator" in file_contents["hasRepresentation"][0]["ebucore:hasRelatedResource"][0].keys():
                    image += file_contents["hasRepresentation"][0]["ebucore:hasRelatedResource"][0]["ebucore:locator"][0]
        if "hasDescription" in file_contents.keys():
            if "dc:description" in file_contents["hasDescription"][0].keys():
                description += file_contents["hasDescription"][0]["dc:description"]["fr"][0] if "fr" in file_contents["hasDescription"][0]["dc:description"].keys() else ""
        if "hasContact" in file_contents.keys():
            if "schema:email" in file_contents["hasContact"][0].keys():
                email += file_contents["hasContact"][0]["schema:email"][0]
            if "schema:telephone" in file_contents["hasContact"][0].keys():
                telephone += file_contents["hasContact"][0]["schema:telephone"]
            if "foaf:homepage" in file_contents["hasContact"][0].keys():
                siteweb += file_contents["hasContact"][0]["foaf:homepage"][0]


        data["nom_activite"] = file_contents["rdfs:label"]["fr"][0]  if "fr" in file_contents["rdfs:label"].keys() else ""
        data["date_debut"] = date_debut
        data["date_fin"] = date_fin
        data["prix"] = price
        data["audiance"] = audiance
        data["latitude"] = latitude
        data["longitude"] = longitude
        data["description"] = description
        data["email"] = email
        data["telephone"] = telephone
        data["siteweb"] = siteweb
        data["image"] = image if not image[len(image)-4:] == ".pdf" else ""

        return data

    # =====
    # Récupérer les fichiers json
    # =====
    # chemin_dossier = r"data"
    chemin_dossier = r"data/objects"
    fichiers_trouves = trouver_fichiers(chemin_dossier)
    taille_fichiers_trouves = len(fichiers_trouves)
    index_fichier = 0
    # =====
    # Pour chaque fichier
    # =====
    for fichier in fichiers_trouves[:]:  
        print(index_fichier, '/', taille_fichiers_trouves)
        index_fichier += 1  
        with open(fichier, encoding='utf-8') as user_file:
            file_contents = json.load(user_file)
        array_type = file_contents["@type"]

        data = getDataClean(file_contents)
        # =====
        # Si le type d'activité corresponds à une des catégorie, l'activité est ajouté dans cette derniere
        # =====
        for type in array_type:
            if type in array_sleep:
                if not data in result_sleep:
                    result_sleep.append(data)
            if type in array_eat:
                if not data in result_eat:
                    result_eat.append(data)
            if type in array_drink:
                if not data in result_drink:
                    result_drink.append(data)
            if type in array_travel:
                if not data in result_travel:
                    result_travel.append(data)
            if type in array_enjoy:
                if not data in result_enjoy:
                    result_enjoy.append(data)

    # =====
    # enregistrer json
    # =====
    with open("result/sleep.json", "w", encoding='utf-8') as f:
        json.dump(result_sleep, f)
    with open("result/eat.json", "w", encoding='utf-8') as f:
        json.dump(result_eat, f)
    with open("result/drink.json", "w", encoding='utf-8') as f:
        json.dump(result_drink, f)
    with open("result/travel.json", "w", encoding='utf-8') as f:
        json.dump(result_travel, f)
    with open("result/enjoy.json", "w", encoding='utf-8') as f:
        json.dump(result_enjoy, f)
        

    

    print("Filtrage des données...")

if __name__ == "__main__":
    filtrer_donnees()