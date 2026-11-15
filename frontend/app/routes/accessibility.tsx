import type { MetaFunction } from "react-router";
import { DocPage, ExternalLink, type DocSection } from "../components/DocPage";
import { DICTS, langFromPath, useLang } from "../i18n";
import { OWNER } from "../lib/site";
import { breadcrumbLd, seo } from "../lib/seo";

export const meta: MetaFunction = ({ location }) => {
  const lang = langFromPath(location.pathname);
  const t = DICTS[lang];
  return seo({
    pathname: location.pathname,
    title: `${t.pages.accessibility} — Epic Road Trip`,
    description: lang === "fr" ? "Déclaration d'accessibilité d'Epic Road Trip : état de conformité RGAA 4.1.2, contenus non accessibles, contact et voies de recours." : "Epic Road Trip accessibility statement: RGAA 4.1.2 / WCAG 2.2 AA conformance status, known issues, feedback and remedies.",
    jsonLd: [breadcrumbLd(lang, "accessibility", t.pages.accessibility)],
  });
};

export default function Accessibility() {
  const lang = useLang();
  const contact = <ExternalLink href={OWNER.contact}>{lang === "fr" ? "formulaire de contact" : "contact form"}</ExternalLink>;

  const fr: DocSection[] = [
    {
      id: "engagement",
      title: "Engagement",
      body: (
        <p>
          Maxence Bonnici s'engage à rendre Epic Road Trip accessible au plus grand nombre. Un site personnel n'est pas soumis à l'obligation de
          l'article 47 de la loi n° 2005-102 du 11 février 2005 ; cette déclaration est publiée volontairement. Elle s'applique à
          tripplanner.mbonnici.fr.
        </p>
      ),
    },
    {
      id: "conformite",
      title: "État de conformité",
      body: (
        <p>
          Epic Road Trip est <strong>partiellement conforme</strong> au référentiel général d'amélioration de l'accessibilité (RGAA) version 4.1.2 et vise
          le niveau AA des WCAG 2.2. Aucun audit complet des 106 critères n'a été réalisé : la conformité totale n'est donc pas déclarée.
        </p>
      ),
    },
    {
      id: "mesures",
      title: "Mesures mises en œuvre",
      body: (
        <ul>
          <li>Composants interactifs basés sur React Aria (rôles, états et navigation clavier conformes aux motifs ARIA).</li>
          <li>Lien d'évitement, structure de titres, repères de navigation et plan du site.</li>
          <li>Focus visible renforcé (anneau sombre et halo jaune) et déplacement du focus sur le titre après chaque navigation.</li>
          <li>Contrastes vérifiés pour les thèmes jour et nuit ; information jamais portée par la couleur seule (icônes et libellés).</li>
          <li>Police Atkinson Hyperlegible, conçue pour les personnes malvoyantes ; zoom et redimensionnement du texte sans perte de contenu.</li>
          <li>Messages d'état annoncés aux technologies d'assistance (calcul d'itinéraire, recherche de lieux, enregistrement).</li>
          <li>Animations désactivées lorsque le système demande une réduction des animations.</li>
          <li>Réorganisation des étapes par boutons (aucun glisser-déposer requis).</li>
        </ul>
      ),
    },
    {
      id: "non-accessibles",
      title: "Contenus non accessibles",
      body: (
        <>
          <p>Non-conformités connues :</p>
          <ul>
            <li>
              La carte interactive est dessinée dans un canevas WebGL : son contenu graphique (fond de carte, marqueurs) n'est pas restitué aux lecteurs
              d'écran. Alternative : la liste des étapes, des distances et des lieux, dans le panneau latéral, présente les mêmes informations et les mêmes
              actions.
            </li>
            <li>Les libellés du fond de carte sont des images de texte fournies par un service tiers.</li>
            <li>Les pages de connexion de Google, utilisées uniquement par les administrateurs du site, relèvent de Google.</li>
          </ul>
        </>
      ),
    },
    {
      id: "tests",
      title: "Réalisation de la déclaration",
      body: (
        <>
          <p>Déclaration établie le 15 novembre 2026 (version 2.0.0), à partir d'une auto-évaluation :</p>
          <ul>
            <li>tests automatisés axe-core (Playwright) sur toutes les pages publiques, en français et en anglais, en thèmes clair et sombre ;</li>
            <li>vérifications de la navigation au clavier sur les parcours principaux, du zoom à 200 % et de l'affichage à 320 px de large.</li>
          </ul>
          <p>
            Technologies utilisées : HTML5, CSS, JavaScript (React), WAI-ARIA, SVG, WebGL (carte). Environnement de test : Chromium récent, en affichage
            ordinateur et mobile.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      title: "Retour d'information et contact",
      body: <p>Si vous ne parvenez pas à accéder à un contenu ou à un service, écrivez-nous via le {contact} : nous vous orienterons vers une alternative accessible ou vous fournirons le contenu sous une autre forme.</p>,
    },
    {
      id: "recours",
      title: "Voies de recours",
      body: (
        <>
          <p>Si vous avez signalé un défaut d'accessibilité sans obtenir de réponse satisfaisante, vous pouvez saisir le Défenseur des droits :</p>
          <ul>
            <li>
              via le <ExternalLink href="https://formulaire.defenseurdesdroits.fr/">formulaire en ligne</ExternalLink> ;
            </li>
            <li>
              auprès d'un <ExternalLink href="https://www.defenseurdesdroits.fr/carte-des-delegues">délégué de votre région</ExternalLink> ;
            </li>
            <li>par courrier gratuit, sans affranchissement : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.</li>
          </ul>
        </>
      ),
    },
  ];

  const en: DocSection[] = [
    {
      id: "commitment",
      title: "Commitment",
      body: <p>Maxence Bonnici is committed to making Epic Road Trip accessible to as many people as possible. A personal website is not subject to French accessibility law (article 47 of law 2005-102); this statement is published voluntarily. It applies to tripplanner.mbonnici.fr.</p>,
    },
    {
      id: "status",
      title: "Conformance status",
      body: <p>Epic Road Trip is <strong>partially compliant</strong> with the French accessibility framework RGAA 4.1.2 and targets WCAG 2.2 level AA. No full audit of the 106 criteria has been carried out, so full compliance is not claimed.</p>,
    },
    {
      id: "measures",
      title: "Measures in place",
      body: (
        <ul>
          <li>Interactive components built on React Aria (ARIA roles, states and keyboard patterns).</li>
          <li>Skip link, heading structure, navigation landmarks and a sitemap.</li>
          <li>Reinforced visible focus (dark ring and yellow halo) and focus moved to the page heading after each navigation.</li>
          <li>Contrast checked for day and night themes; information never conveyed by colour alone (icons and labels).</li>
          <li>Atkinson Hyperlegible typeface, designed for low-vision readers; zoom and text resizing without loss of content.</li>
          <li>Status messages announced to assistive technologies (route calculation, place search, saving).</li>
          <li>Animations disabled when the system requests reduced motion.</li>
          <li>Stops reordered with buttons (no drag and drop required).</li>
        </ul>
      ),
    },
    {
      id: "issues",
      title: "Non-accessible content",
      body: (
        <>
          <p>Known issues:</p>
          <ul>
            <li>The interactive map is drawn in a WebGL canvas: its graphics (basemap, markers) are not exposed to screen readers. Alternative: the side panel lists the stops, distances and places with the same information and actions.</li>
            <li>Basemap labels are images of text provided by a third-party service.</li>
            <li>Google's own sign-in pages, used only by the site's administrators, are outside our control.</li>
          </ul>
        </>
      ),
    },
    {
      id: "testing",
      title: "How this statement was prepared",
      body: (
        <>
          <p>Statement drawn up on 15 November 2026 (version 2.0.0), based on a self-assessment:</p>
          <ul>
            <li>automated axe-core tests (Playwright) on every public page, in French and English, in light and dark themes;</li>
            <li>keyboard navigation checks on the main journeys, 200% zoom and 320 px-wide display.</li>
          </ul>
          <p>Technologies: HTML5, CSS, JavaScript (React), WAI-ARIA, SVG, WebGL (map). Test environment: recent Chromium, desktop and mobile viewports.</p>
        </>
      ),
    },
    { id: "feedback", title: "Feedback and contact", body: <p>If you cannot access some content or a service, write to us through the {contact}: we will point you to an accessible alternative or provide the content in another format.</p> },
    {
      id: "remedies",
      title: "Remedies",
      body: (
        <p>
          If you reported an accessibility issue without a satisfactory answer, you can contact the French Defender of Rights (Défenseur des droits)
          through their <ExternalLink href="https://formulaire.defenseurdesdroits.fr/">online form</ExternalLink> or by free post: Défenseur des droits, Libre
          réponse 71120, 75342 Paris CEDEX 07, France.
        </p>
      ),
    },
  ];

  return <DocPage title={DICTS[lang].pages.accessibility} sections={lang === "fr" ? fr : en} />;
}
