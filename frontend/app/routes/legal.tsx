import { Link, type MetaFunction } from "react-router";
import { DocPage, ExternalLink, type DocSection } from "../components/DocPage";
import { DICTS, langFromPath, useHref, useLang } from "../i18n";
import { OWNER, REPO_URL } from "../lib/site";
import { breadcrumbLd, seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({
    pathname: location.pathname,
    title: `${t.pages.legal} — Epic Road Trip`,
    description: lang === "fr" ? "Éditeur, hébergement, propriété intellectuelle et crédits des données d'Epic Road Trip." : "Publisher, hosting, intellectual property and data credits for Epic Road Trip.",
    jsonLd: [breadcrumbLd(lang, "legal", t.pages.legal)],
  });
};

function CreditsTable({ lang }: { lang: "fr" | "en" }) {
  const rows: [string, string, string][] =
    lang === "fr"
      ? [
          ["OpenStreetMap", "Restaurants, hébergements, sites, stations", "© contributeurs OpenStreetMap — ODbL 1.0"],
          ["Geofabrik", "Extrait OpenStreetMap de la France", "Données OSM — ODbL 1.0"],
          ["OpenFreeMap / OpenMapTiles", "Fond de carte vectoriel", "© OpenMapTiles, données OSM"],
          ["geo.api.gouv.fr", "Communes, codes postaux, populations", "INSEE / La Poste — Licence Ouverte Etalab 2.0"],
          ["DataTourisme", "Événements (si activé)", "Licence Ouverte Etalab 2.0"],
          ["OSRM", "Calcul d'itinéraire routier", "Project OSRM (BSD-2), serveur FOSSGIS e.V."],
          ["MapLibre GL JS", "Affichage de la carte", "BSD-3-Clause"],
          ["Lucide", "Icônes de l'interface", "ISC"],
        ]
      : [
          ["OpenStreetMap", "Restaurants, places to stay, sights, stations", "© OpenStreetMap contributors — ODbL 1.0"],
          ["Geofabrik", "OpenStreetMap extract of France", "OSM data — ODbL 1.0"],
          ["OpenFreeMap / OpenMapTiles", "Vector basemap", "© OpenMapTiles, OSM data"],
          ["geo.api.gouv.fr", "Communes, postcodes, population", "INSEE / La Poste — Etalab Open Licence 2.0"],
          ["DataTourisme", "Events (when enabled)", "Etalab Open Licence 2.0"],
          ["OSRM", "Driving route calculation", "Project OSRM (BSD-2), FOSSGIS e.V. server"],
          ["MapLibre GL JS", "Map rendering", "BSD-3-Clause"],
          ["Lucide", "Interface icons", "ISC"],
        ];
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="credits-title">
      <table>
        <caption className="visually-hidden">{lang === "fr" ? "Sources de données et logiciels tiers" : "Data sources and third-party software"}</caption>
        <thead>
          <tr>
            <th scope="col">{lang === "fr" ? "Source" : "Source"}</th>
            <th scope="col">{lang === "fr" ? "Usage" : "Used for"}</th>
            <th scope="col">{lang === "fr" ? "Licence / attribution" : "Licence / attribution"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c]) => (
            <tr key={a}>
              <th scope="row">{a}</th>
              <td>{b}</td>
              <td>{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Legal() {
  const lang = useLang();
  const href = useHref();
  const contact = <ExternalLink href={OWNER.contact}>{lang === "fr" ? "formulaire de contact de mbonnici.fr" : "contact form on mbonnici.fr"}</ExternalLink>;

  const fr: DocSection[] = [
    {
      id: "editeur",
      title: "Éditeur du site",
      body: (
        <>
          <p>
            Le site <strong>tripplanner.mbonnici.fr</strong> est édité par <strong>Maxence Bonnici</strong>, à titre de personne physique et non
            professionnel.
          </p>
          <ul>
            <li>Directeur de la publication : Maxence Bonnici.</li>
            <li>Contact : {contact}.</li>
            <li>
              Site personnel : <ExternalLink href={OWNER.site}>mbonnici.fr</ExternalLink>.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "hebergement",
      title: "Hébergement",
      body: (
        <p>
          Serveur personnel auto-hébergé en France, déployé avec Coolify et exposé via Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107,
          États-Unis.
        </p>
      ),
    },
    {
      id: "projet",
      title: "Origine du projet",
      body: (
        <p>
          Epic Road Trip a été conçu en 2024 à Epitech Marseille par Maxence Bonnici, Maxence Laporte, Meriem Boussaid et Federico Suarez, puis
          entièrement repensé en 2026 par Maxence Bonnici. Voir la page <Link to={href("about")}>À propos</Link>.
        </p>
      ),
    },
    {
      id: "propriete",
      title: "Propriété intellectuelle",
      body: (
        <>
          <p>
            Le code source est publié sous licence <ExternalLink href={`${REPO_URL}/blob/main/LICENSE`}>MIT</ExternalLink>{" "}
            et publié sur <ExternalLink href={REPO_URL}>GitHub</ExternalLink>. Les illustrations et l'identité visuelle ont été créées pour le projet.
          </p>
          <p>
            Les données OpenStreetMap restent soumises à l'ODbL : toute réutilisation doit créditer « © contributeurs OpenStreetMap » et respecter cette
            licence. Les marques citées (Google, GitHub, Cloudflare…) appartiennent à leurs propriétaires et ne servent qu'à désigner leurs services.
          </p>
        </>
      ),
    },
    { id: "credits", title: "Données et logiciels tiers", body: <CreditsTable lang="fr" /> },
    {
      id: "polices",
      title: "Polices de caractères",
      body: (
        <p>
          Barlow Condensed, Atkinson Hyperlegible Next et Instrument Serif, sous licence SIL Open Font License 1.1, sont servies depuis ce serveur via
          Fontsource : aucune requête n'est envoyée à Google Fonts ni à un autre service tiers.
        </p>
      ),
    },
    {
      id: "responsabilite",
      title: "Responsabilité",
      body: (
        <>
          <p>
            Les informations sont fournies à titre indicatif. Les lieux proviennent de sources collaboratives et peuvent être incomplets ou périmés
            (horaires, fermetures). Les distances et durées de trajet sont des estimations qui ne tiennent compte ni du trafic, ni des travaux, ni des
            pauses.
          </p>
          <p>
            Le conducteur reste seul responsable de sa conduite : vérifiez l'état des routes, respectez le code de la route et ne manipulez pas votre
            téléphone en conduisant. L'éditeur ne saurait être tenu responsable des dommages directs ou indirects liés à l'utilisation du site ou des
            sites tiers vers lesquels il renvoie.
          </p>
        </>
      ),
    },
  ];

  const en: DocSection[] = [
    {
      id: "publisher",
      title: "Publisher",
      body: (
        <>
          <p>
            <strong>tripplanner.mbonnici.fr</strong> is published by <strong>Maxence Bonnici</strong>, as a private individual on a non-commercial basis.
          </p>
          <ul>
            <li>Publication director: Maxence Bonnici.</li>
            <li>Contact: {contact}.</li>
            <li>
              Personal website: <ExternalLink href={OWNER.site}>mbonnici.fr</ExternalLink>.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "hosting",
      title: "Hosting",
      body: <p>Self-hosted personal server in France, deployed with Coolify and served through Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA.</p>,
    },
    {
      id: "project",
      title: "Project history",
      body: (
        <p>
          Epic Road Trip was created in 2024 at Epitech Marseille by Maxence Bonnici, Maxence Laporte, Meriem Boussaid and Federico Suarez, then fully
          redesigned in 2026 by Maxence Bonnici. See the <Link to={href("about")}>About</Link> page.
        </p>
      ),
    },
    {
      id: "ip",
      title: "Intellectual property",
      body: (
        <>
          <p>
            The source code is released under the <ExternalLink href={`${REPO_URL}/blob/main/LICENSE`}>MIT License</ExternalLink>{" "}
            and published on <ExternalLink href={REPO_URL}>GitHub</ExternalLink>. Illustrations and visual identity were created for the project.
          </p>
          <p>
            OpenStreetMap data remains under the ODbL: any reuse must credit “© OpenStreetMap contributors” and comply with that licence. Trademarks
            mentioned (Google, GitHub, Cloudflare…) belong to their owners and are only used to refer to their services.
          </p>
        </>
      ),
    },
    { id: "credits", title: "Third-party data and software", body: <CreditsTable lang="en" /> },
    {
      id: "fonts",
      title: "Fonts",
      body: <p>Barlow Condensed, Atkinson Hyperlegible Next and Instrument Serif, under the SIL Open Font License 1.1, are served from this server via Fontsource: no request is sent to Google Fonts or any other third party.</p>,
    },
    {
      id: "liability",
      title: "Liability",
      body: (
        <>
          <p>
            Information is provided for guidance only. Places come from collaborative sources and may be incomplete or outdated (opening hours,
            closures). Distances and drive times are estimates that do not account for traffic, roadworks or breaks.
          </p>
          <p>
            Drivers remain solely responsible for their driving: check road conditions, follow the highway code and never handle your phone while
            driving. The publisher cannot be held liable for any direct or indirect damage arising from the use of this site or of third-party sites it
            links to.
          </p>
        </>
      ),
    },
  ];

  return <DocPage title={DICTS[lang].pages.legal} sections={lang === "fr" ? fr : en} />;
}
