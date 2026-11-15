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
    title: `${t.pages.privacy} — Epic Road Trip`,
    description:
      lang === "fr"
        ? "Données collectées, finalités, durées de conservation, cookies et droits RGPD sur Epic Road Trip. Un seul cookie, strictement nécessaire."
        : "Data collected, purposes, retention, cookies and GDPR rights on Epic Road Trip. A single, strictly necessary cookie.",
    jsonLd: [breadcrumbLd(lang, "privacy", t.pages.privacy)],
  });
};

export default function Privacy() {
  const lang = useLang();
  const href = useHref();
  const contact = <ExternalLink href={OWNER.contact}>{lang === "fr" ? "formulaire de contact" : "contact form"}</ExternalLink>;
  const profile = <Link to={href("profile")}>{DICTS[lang].pages.profile}</Link>;

  const fr: DocSection[] = [
    {
      id: "resume",
      title: "En bref",
      body: (
        <ul>
          <li>Aucune publicité, aucun outil de mesure d'audience, aucune donnée vendue ou cédée.</li>
          <li>Pas de compte pour les visiteurs : vos voyages et favoris restent dans votre navigateur. Vous pouvez les exporter ou les effacer depuis {profile}.</li>
          <li>Aucun cookie pour les visiteurs, donc aucun bandeau de consentement. Seuls les administrateurs du site reçoivent un cookie de session.</li>
        </ul>
      ),
    },
    {
      id: "responsable",
      title: "Responsable du traitement",
      body: <p>Maxence Bonnici, éditeur du site, joignable via le {contact}.</p>,
    },
    {
      id: "donnees",
      title: "Données traitées, finalités et bases légales",
      body: (
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="donnees-title">
          <table>
            <thead>
              <tr>
                <th scope="col">Données</th>
                <th scope="col">Finalité</th>
                <th scope="col">Base légale</th>
                <th scope="col">Conservation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Compte administrateur (éditeur du site uniquement) : adresse e-mail, nom et identifiant Google, langue</td>
                <td>Administrer la galerie des voyages partagés</td>
                <td>Intérêt légitime (art. 6.1.f RGPD)</td>
                <td>Tant que l'adresse figure parmi les administrateurs</td>
              </tr>
              <tr>
                <td>Voyages publiés dans la galerie par l'éditeur (étapes, dates, adresses épinglées)</td>
                <td>Proposer des itinéraires à tous</td>
                <td>Intérêt légitime (art. 6.1.f)</td>
                <td>Jusqu'à leur retrait</td>
              </tr>
              <tr>
                <td>Communes et coordonnées des étapes recherchées</td>
                <td>Calculer l'itinéraire et chercher des lieux</td>
                <td>Intérêt légitime à fournir le service (art. 6.1.f)</td>
                <td>Non rattachées à votre compte ; cache technique en mémoire de 10 minutes à 24 heures</td>
              </tr>
              <tr>
                <td>Adresse IP, date, page demandée, navigateur</td>
                <td>Sécurité, prévention des abus, diagnostic</td>
                <td>Intérêt légitime (art. 6.1.f)</td>
                <td>Journaux serveur à rotation automatique ; compteur anti-abus de 15 minutes en mémoire</td>
              </tr>
              <tr>
                <td>Messages envoyés via « Avis / bug » (e-mail ou ticket GitHub)</td>
                <td>Répondre, corriger les bugs, améliorer le service</td>
                <td>Intérêt légitime (art. 6.1.f)</td>
                <td>E-mails : 12 mois après le dernier échange. Tickets GitHub : publics, selon vos choix sur GitHub</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "cookies",
      title: "Cookies et stockage local",
      body: (
        <>
          <p>
            Aucun cookie n'est déposé chez les visiteurs. Seuls les administrateurs reçoivent un cookie de session, <code>ert_session</code>, strictement nécessaire
            (exempté de consentement, art. 82 de la loi Informatique et Libertés) : HttpOnly, Secure, SameSite=Lax, valable 30 jours, supprimé à la déconnexion.
          </p>
          <p>
            Votre navigateur garde aussi, sur votre appareil uniquement : votre préférence de thème (<code>ert-theme</code>, stockage local) et les adresses
            épinglées du voyage en cours (<code>ert-pins</code>, stockage de session effacé à la fermeture de l'onglet) et vos voyages et favoris enregistrés (<code>ert-local-trips</code>, <code>ert-local-favorites</code>, stockage local). Ces données ne sont jamais envoyées au serveur ; vous pouvez les exporter, les importer sur un autre appareil ou les effacer depuis « Mon espace ». Un lien de partage contient l'itinéraire et les lieux épinglés dans l'adresse elle-même : rien n'est stocké sur le serveur.
          </p>
          <p>
            Aucun script Google n'est chargé sur ce site. La connexion Google, réservée aux administrateurs, est une simple redirection vers <code>accounts.google.com</code> ;
            un cookie technique temporaire (<code>ert_oauth</code>, 10 minutes) protège ce retour contre la falsification. Sur les pages de Google, Google
            LLC applique sa <ExternalLink href="https://policies.google.com/privacy">politique de confidentialité</ExternalLink>.
          </p>
        </>
      ),
    },
    {
      id: "destinataires",
      title: "Destinataires et sous-traitants",
      body: (
        <>
          <p>Vos données ne sont ni vendues ni cédées. Seuls interviennent :</p>
          <ul>
            <li>Cloudflare, Inc. (États-Unis) : réseau de diffusion et protection du site ; traite les adresses IP. Transfert encadré par le Data Privacy Framework UE–États-Unis.</li>
            <li>FOSSGIS e.V. (Allemagne), opérateur du serveur OSRM : reçoit, depuis notre serveur, les coordonnées des étapes pour calculer l'itinéraire. Votre adresse IP ne lui est pas transmise.</li>
            <li>OpenFreeMap : les tuiles de carte sont récupérées par notre serveur (proxy), votre navigateur ne contacte pas ce service.</li>
            <li>Google LLC (États-Unis), uniquement pour la connexion des administrateurs : vérification de leur identité (OAuth 2.0 / OpenID Connect).</li>
            <li>GitHub, Inc. (États-Unis), uniquement si vous choisissez d'ouvrir un ticket public depuis « Avis / bug ».</li>
          </ul>
        </>
      ),
    },
    {
      id: "securite",
      title: "Sécurité",
      body: (
        <p>
          Connexion chiffrée (HTTPS) ; aucun compte visiteur, donc aucun mot de passe à protéger ; administration réservée à une liste d'adresses Google
          (OAuth 2.0 avec PKCE), révocable à tout moment ; cookie de session HttpOnly, contrôle de l'origine des requêtes, limitation des requêtes et politique
          de sécurité du contenu (CSP).
        </p>
      ),
    },
    {
      id: "droits",
      title: "Vos droits",
      body: (
        <>
          <p>
            Vous disposez des droits d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition. Le serveur ne conserve
            aucune donnée de compte sur les visiteurs : vos voyages et favoris sont dans votre navigateur, et {profile} permet de les exporter ou de les effacer. Pour toute autre demande,
            utilisez le {contact} : une réponse vous sera apportée sous un mois.
          </p>
          <p>
            Vous pouvez introduire une réclamation auprès de la CNIL : <ExternalLink href="https://www.cnil.fr/fr/plaintes">cnil.fr/plaintes</ExternalLink>,
            3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
          </p>
        </>
      ),
    },
  ];

  const en: DocSection[] = [
    {
      id: "summary",
      title: "In short",
      body: (
        <ul>
          <li>No ads, no analytics tools, no data sold or shared.</li>
          <li>No accounts for visitors: your trips and favourites stay in your browser. You can export or erase them from {profile}.</li>
          <li>No cookie for visitors, hence no consent banner. Only the site's administrators get a session cookie.</li>
        </ul>
      ),
    },
    { id: "controller", title: "Data controller", body: <p>Maxence Bonnici, publisher of the site, reachable through the {contact}.</p> },
    {
      id: "data",
      title: "Data processed, purposes and legal bases",
      body: (
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="data-title">
          <table>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Purpose</th>
                <th scope="col">Legal basis</th>
                <th scope="col">Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Administrator account (the site's publisher only): email address, Google name and identifier, language</td>
                <td>Run the shared trips gallery</td>
                <td>Legitimate interest (GDPR art. 6.1.f)</td>
                <td>As long as the address is on the administrators list</td>
              </tr>
              <tr>
                <td>Trips published in the gallery by the publisher (stops, dates, pinned places)</td>
                <td>Offer itineraries to everyone</td>
                <td>Legitimate interest (art. 6.1.f)</td>
                <td>Until they are removed</td>
              </tr>
              <tr>
                <td>Communes and coordinates of the stops you search</td>
                <td>Compute the route and look for places</td>
                <td>Legitimate interest in providing the service (art. 6.1.f)</td>
                <td>Not linked to your account; in-memory technical cache from 10 minutes to 24 hours</td>
              </tr>
              <tr>
                <td>IP address, date, requested page, browser</td>
                <td>Security, abuse prevention, troubleshooting</td>
                <td>Legitimate interest (art. 6.1.f)</td>
                <td>Server logs with automatic rotation; 15-minute in-memory anti-abuse counter</td>
              </tr>
              <tr>
                <td>Messages sent through “Feedback” (email or GitHub issue)</td>
                <td>Reply, fix bugs, improve the service</td>
                <td>Legitimate interest (art. 6.1.f)</td>
                <td>Emails: 12 months after the last exchange. GitHub issues: public, according to your choices on GitHub</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      body: (
        <>
          <p>
            Visitors get no cookie at all. Only administrators receive a session cookie, <code>ert_session</code>, strictly necessary (exempt from consent under French data
            protection law): HttpOnly, Secure, SameSite=Lax, valid for 30 days, removed when they sign out.
          </p>
          <p>
            Your browser also keeps, on your device only: your theme preference (<code>ert-theme</code>, local storage) and the places pinned on the current
            trip (<code>ert-pins</code>, session storage cleared when the tab closes) and your saved trips and favourites (<code>ert-local-trips</code>, <code>ert-local-favorites</code>, local storage). This data is never sent to the server; you can export it, import it on another device or erase it from “My space”. A share link carries the itinerary and pinned places in the address itself: nothing is stored on the server.
          </p>
          <p>
            No Google script is loaded on this site. Google sign-in, reserved to administrators, is a plain redirect to <code>accounts.google.com</code>; a temporary
            technical cookie (<code>ert_oauth</code>, 10 minutes) protects the return trip against forgery. On Google's pages, Google LLC applies its{" "}
            <ExternalLink href="https://policies.google.com/privacy">privacy policy</ExternalLink>.
          </p>
        </>
      ),
    },
    {
      id: "recipients",
      title: "Recipients and processors",
      body: (
        <>
          <p>Your data is never sold or shared. Only the following are involved:</p>
          <ul>
            <li>Cloudflare, Inc. (USA): content delivery and protection; processes IP addresses. Transfers covered by the EU–US Data Privacy Framework.</li>
            <li>FOSSGIS e.V. (Germany), operator of the OSRM server: receives the stop coordinates from our server to compute the route. Your IP address is not sent.</li>
            <li>OpenFreeMap: map tiles are fetched by our server (proxy); your browser does not contact this service.</li>
            <li>Google LLC (USA), only for administrator sign-in: identity verification (OAuth 2.0 / OpenID Connect).</li>
            <li>GitHub, Inc. (USA), only if you choose to open a public issue from “Feedback”.</li>
          </ul>
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      body: (
        <p>
          Encrypted connection (HTTPS); no visitor accounts, hence no passwords to protect; administration restricted to a list of Google addresses (OAuth 2.0
          with PKCE), revocable at any time; HttpOnly session cookie, request-origin checks, rate limiting and a content security policy (CSP).
        </p>
      ),
    },
    {
      id: "rights",
      title: "Your rights",
      body: (
        <>
          <p>
            You have the rights of access, rectification, erasure, portability, restriction and objection. The server keeps no account data about
            visitors: your trips and favourites are in your browser, and {profile} lets you export or erase them. For any other request, use the {contact}: you will get an answer within a
            month.
          </p>
          <p>
            You can lodge a complaint with the French data protection authority (CNIL): <ExternalLink href="https://www.cnil.fr/fr/plaintes">cnil.fr/plaintes</ExternalLink>.
          </p>
        </>
      ),
    },
  ];

  return <DocPage title={DICTS[lang].pages.privacy} sections={lang === "fr" ? fr : en} />;
}
