import { Link, type MetaFunction } from "react-router";
import { DocPage, ExternalLink, type DocSection } from "../components/DocPage";
import { DICTS, langFromPath, useHref, useLang } from "../i18n";
import { OWNER } from "../lib/site";
import { breadcrumbLd, seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({
    pathname: location.pathname,
    title: `${t.pages.terms} — Epic Road Trip`,
    description: lang === "fr" ? "Règles d'utilisation du planificateur de road trips Epic Road Trip : compte, voyages publiés, usage acceptable, responsabilité." : "Rules for using the Epic Road Trip planner: account, published trips, acceptable use, liability.",
    jsonLd: [breadcrumbLd(lang, "terms", t.pages.terms)],
  });
};

export default function Terms() {
  const lang = useLang();
  const href = useHref();
  const privacy = <Link to={href("privacy")}>{DICTS[lang].pages.privacy}</Link>;
  const contact = <ExternalLink href={OWNER.contact}>{lang === "fr" ? "formulaire de contact" : "contact form"}</ExternalLink>;

  const fr: DocSection[] = [
    { id: "objet", title: "Objet", body: <p>Ces conditions encadrent l'utilisation d'Epic Road Trip, planificateur de road trips en France édité par Maxence Bonnici. Utiliser le site vaut acceptation de ces conditions.</p> },
    {
      id: "acces",
      title: "Accès au service",
      body: <p>Le service est gratuit. La planification ne nécessite pas de compte. Aucun compte n'est nécessaire : vos voyages et favoris sont enregistrés dans votre navigateur. L'éditeur s'efforce d'assurer la disponibilité du site sans la garantir et peut l'interrompre pour maintenance.</p>,
    },
    {
      id: "compte",
      title: "Vos données sur l'appareil",
      body: (
        <p>
          Le site ne propose pas de compte aux visiteurs. Vos voyages et favoris sont enregistrés dans votre navigateur : ils disparaissent si vous effacez les
          données du site, et il vous appartient de les exporter si vous souhaitez les conserver ou les retrouver sur un autre appareil. Un lien de partage
          contient l'itinéraire : toute personne qui le reçoit peut l'ouvrir. L'administration du site est réservée à l'éditeur, connecté avec son compte Google.
          Le traitement des données est décrit dans la {privacy}.
        </p>
      ),
    },
    {
      id: "contenus",
      title: "Voyages publiés",
      body: (
        <p>
          La galerie des voyages partagés est composée par l'éditeur. Les itinéraires et lieux proposés sont indicatifs : vérifiez sur place horaires,
          accès et conditions de circulation. Signalez une erreur via le bouton « Avis / bug » ou le {contact}.
        </p>
      ),
    },
    {
      id: "usage",
      title: "Usage acceptable",
      body: (
        <ul>
          <li>Ne pas perturber le service, contourner ses protections ou tenter d'accéder aux comptes d'autrui.</li>
          <li>Ne pas extraire massivement les données ; l'API documentée peut être utilisée dans des volumes raisonnables.</li>
          <li>Des limites de fréquence s'appliquent aux requêtes (recherche, itinéraires, lieux).</li>
        </ul>
      ),
    },
    {
      id: "route",
      title: "Itinéraires et sécurité routière",
      body: <p>Les itinéraires, durées et lieux sont indicatifs. Ne consultez pas le site en conduisant, respectez le code de la route et la signalisation, et vérifiez les informations importantes (horaires, accès, fermetures) auprès des établissements.</p>,
    },
    {
      id: "propriete",
      title: "Propriété intellectuelle",
      body: <p>Le code source est publié sous licence MIT : vous pouvez le réutiliser en conservant la mention de copyright. Les données OpenStreetMap sont soumises à l'ODbL et leur réutilisation doit en respecter les conditions.</p>,
    },
    { id: "evolution", title: "Évolution des conditions", body: <p>Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page. Les changements importants seront signalés sur le site.</p> },
    { id: "droit", title: "Droit applicable", body: <p>Ces conditions sont soumises au droit français. En cas de litige, et à défaut de solution amiable, les tribunaux français sont compétents.</p> },
  ];

  const en: DocSection[] = [
    { id: "purpose", title: "Purpose", body: <p>These terms govern the use of Epic Road Trip, a road trip planner for France published by Maxence Bonnici. Using the site means accepting these terms.</p> },
    { id: "access", title: "Access", body: <p>The service is free. Planning does not require an account. No account is needed: your trips and favourites are saved in your browser. The publisher strives to keep the site available without guaranteeing it and may suspend it for maintenance.</p> },
    {
      id: "account",
      title: "Your data on the device",
      body: <p>The site offers no accounts to visitors. Your trips and favourites are saved in your browser: they disappear if you clear the site's data, and it is up to you to export them to keep them or use them on another device. A share link contains the itinerary: anyone who receives it can open it. Site administration is reserved to the publisher, signed in with their Google account. How data is handled is described in the {privacy}.</p>,
    },
    {
      id: "content",
      title: "Published trips",
      body: <p>The shared trips gallery is curated by the publisher. Suggested itineraries and places are indicative: check opening hours, access and traffic conditions on site. Report a mistake with the “Feedback” button or the {contact}.</p>,
    },
    {
      id: "use",
      title: "Acceptable use",
      body: (
        <ul>
          <li>Do not disrupt the service, bypass its protections or try to access other people's accounts.</li>
          <li>Do not scrape data at scale; the documented API may be used in reasonable volumes.</li>
          <li>Rate limits apply to requests (search, routes, places).</li>
        </ul>
      ),
    },
    { id: "road", title: "Routes and road safety", body: <p>Routes, durations and places are for guidance only. Do not use the site while driving, follow the highway code and road signs, and check important information (opening hours, access, closures) with the venues.</p> },
    { id: "ip", title: "Intellectual property", body: <p>The source code is released under the MIT License: you may reuse it as long as the copyright notice is kept. OpenStreetMap data is subject to the ODbL and any reuse must comply with its terms.</p> },
    { id: "changes", title: "Changes", body: <p>These terms may change; the last update date is shown at the top of the page. Significant changes will be announced on the site.</p> },
    { id: "law", title: "Governing law", body: <p>These terms are governed by French law. In the event of a dispute, and failing an amicable solution, French courts have jurisdiction.</p> },
  ];

  return <DocPage title={DICTS[lang].pages.terms} sections={lang === "fr" ? fr : en} />;
}
