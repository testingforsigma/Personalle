# Assistant IA direct — GitHub Pages

## Installation

1. Décompresse ce dossier.
2. Ouvre `admin-config.js`. Vérifie `apiUrl`, `apiKey` et `model`.
3. Envoie tous les fichiers du dossier dans ton dépôt GitHub `testingforsigma/Portfolio_personal`.
4. Attends le déploiement GitHub Pages puis ouvre https://testingforsigma.github.io/Portfolio_personal/.
5. Clique sur **Assistant IA**, écris une demande et appuie sur **Envoyer à l’IA**.

## Configuration du fournisseur

Le widget appelle directement une API compatible OpenAI depuis le navigateur. La configuration de démonstration utilise l’URL Selora, la clé fournie comme clé fictive par le propriétaire et le modèle `gpt-4o-mini`. Si le fournisseur ne reconnaît pas ce modèle, remplace `model` par un identifiant de modèle activé dans ton compte.

## À savoir

- Aucune fonction serveur, aucun compte Vercel et aucun mot de passe administrateur ne sont requis.
- La clé inscrite dans `admin-config.js` est publique : chaque visiteur peut la lire dans les fichiers du site et l’utiliser. N’utilise jamais une vraie clé personnelle ou payante dans cette version.
- Les demandes sont envoyées directement du navigateur au fournisseur. Celui-ci doit autoriser les requêtes CORS depuis GitHub Pages.
- Les modifications proposées s’appliquent à la page ouverte et disparaissent au rechargement. Ce widget ne pousse pas de commit GitHub et ne modifie pas durablement les fichiers hébergés.
- L’éditeur reste limité à certains textes, styles et à l’ajout de sections simples ; il n’exécute pas de code arbitraire.
