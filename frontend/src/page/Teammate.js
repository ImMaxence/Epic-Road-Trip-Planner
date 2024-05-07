import React from 'react';
import Contributor from '../component/Contributor';

const Teammate = () => {
    return (
        <>
            <div className="wrapper_team">
                <Contributor name="Maxence Bonnici" color="blue" image="./image/team4.jpeg"
                    description="Je suis un développeur frontend et étudiant à Epitech Marseille. Passionné par la création d'expériences utilisateur exceptionnelles, je m'efforce d'apporter créativité et expertise à chaque projet"
                    social1="https://www.linkedin.com/in/maxence-bonnici-77b540250/" social2="https://github.com/ImMaxence" />

                <Contributor name="Federico Suarez" color="yellow" image="./image/team1.jpeg"
                    description="Étudiant à Epitech, passionné de pentest et développement web, spécialisé en sécurité des applications. Expert en détection et correction de vulnérabilités, maîtrisant les techniques d'attaque cybercriminelles"
                    social1="www.linkedin.com/in/federico-suarez" social2="https://github.com/FedeSCode" />

                <Contributor name="Meriem Boussaid" color="violet" image="./image/team3.png"
                    description="Je m'appelle Meriem, étudiante à Epitech Marseille. J'aime mettre à profit mes compétences de développement et mon intérêt pour le traitement de données pour enrichir mes projets et créer des solutions innovantes"
                    social1="https://www.linkedin.com/in/meriem-boussaid-571194220/" social2="https://github.com/boussaidm" />

                <Contributor name="Maxence Laporte" color="green" image="./image/team2.jpeg"
                    description="Je suis un etudiant chez Epitech spécialisé dans le traitement de donnée et dans la conception d'un backend efficace et fonctionnel, je suis aussi également occuper de la documentation swagger"
                    social1="https://www.linkedin.com/in/maxence-laporte-391583230/" social2="https://github.com/TheMaxquent" />
            </div>
        </>
    );
};

export default Teammate;