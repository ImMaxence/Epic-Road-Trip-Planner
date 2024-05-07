import subprocess

# Démarrer l'application Flask
flask_process = subprocess.Popen(["python", "-m", "flask", "run", "--host=0.0.0.0"])

# Lancer le script uploadAndTreatData.py
subprocess.call(["python", "uploadAndTreatData.py"])

# Attendre que le processus Flask se termine
flask_process.terminate()
