# 🚀 Guide de Déploiement : studio.leonardkabo.cloud sur VPS Hostinger (KVM2)

Ce guide détaille pas-à-pas comment héberger **LuminaPro Studio** sur votre serveur VPS Hostinger aux côtés de vos autres applications (`paralegal.leonardkabo.cloud`, `n8n.leonardkabo.cloud`, etc.) sans aucun conflit, avec **mise à jour automatique à chaque `git push` sur GitHub**.

---

## 📌 Architecture Recommandée
* **DNS** : Sous-domaine `studio.leonardkabo.cloud` pointant vers l'IP publique de votre VPS.
* **Port interne de l'application** : `3005` (via Docker Compose ou PM2).
* **Reverse Proxy Nginx** : Reçoit le trafic HTTPS sur le port `443` et le redirige vers `127.0.0.1:3005`.
* **Certificat SSL** : Gratuit et renouvelable automatiquement via Let's Encrypt / Certbot.
* **CI/CD** : GitHub Actions via SSH pour redéployer automatiquement à chaque commit sur `main`.

---

## 🛠️ Étape 1 : Configuration DNS (Hostinger ou Cloudflare)
1. Rendez-vous dans la zone DNS de votre domaine `leonardkabo.cloud`.
2. Ajoutez un enregistrement **A** :
   * **Nom / Hôte** : `studio`
   * **Valeur / Cible** : L'adresse IP de votre serveur VPS Hostinger
   * **TTL** : 300 ou Automatique

---

## 🛠️ Étape 2 : Envoyer le code sur GitHub
1. Initialisez votre dépôt Git et publiez-le sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit LuminaPro Studio"
   git branch -M main
   git remote add origin https://github.com/VOTRE_PSEUDO/studio-leonardkabo.git
   git push -u origin main
   ```

---

## 🛠️ Étape 3 : Installation initiale sur le VPS Hostinger

Connectez-vous à votre VPS en SSH :
```bash
ssh root@IP_DE_VOTRE_VPS
```

1. **Créer le dossier de l'application et cloner le dépôt :**
   ```bash
   mkdir -p /var/www
   cd /var/www
   git clone https://github.com/VOTRE_PSEUDO/studio-leonardkabo.git studio.leonardkabo.cloud
   cd studio.leonardkabo.cloud
   ```

2. **Créer le fichier d'environnement `.env` :**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Renseignez votre clé API Gemini :
   ```env
   NODE_ENV=production
   PORT=3000
   GEMINI_API_KEY=votre_cle_gemini_api_secrete
   ```
   *(Sauvegardez avec `Ctrl + O` puis quittez avec `Ctrl + X`)*.

3. **Lancer l'application avec Docker Compose (Recommandé) :**
   ```bash
   docker compose up -d --build
   ```
   *L'application tourne maintenant en tâche de fond sur `127.0.0.1:3005` sans perturber vos autres conteneurs.*

---

## 🛠️ Étape 4 : Configuration du Reverse Proxy Nginx & SSL

1. **Copier le fichier de configuration Nginx :**
   ```bash
   sudo cp nginx/studio.leonardkabo.cloud.conf /etc/nginx/sites-available/studio.leonardkabo.cloud
   sudo ln -s /etc/nginx/sites-available/studio.leonardkabo.cloud /etc/nginx/sites-enabled/
   ```

2. **Tester la configuration Nginx :**
   ```bash
   sudo nginx -t
   ```
   *(Vous devez obtenir `syntax is ok` et `test is successful`)*.

3. **Recharger Nginx :**
   ```bash
   sudo systemctl reload nginx
   ```

4. **Activer le HTTPS avec Let's Encrypt (Certbot) :**
   ```bash
   sudo certbot --nginx -d studio.leonardkabo.cloud
   ```
   *Certbot configure automatiquement les certificats SSL et la redirection HTTP vers HTTPS sans toucher à vos autres sites.*

---

## 🛠️ Étape 5 : Automatisation CI/CD avec GitHub Actions

Pour que chaque `git push` mette à jour automatiquement le site en ligne :

1. Sur votre dépôt GitHub, allez dans **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
2. Ajoutez les 3 secrets suivants :
   * `VPS_HOST` : L'adresse IP de votre VPS.
   * `VPS_USERNAME` : `root` (ou votre utilisateur SSH avec droits sudo/docker).
   * `VPS_SSH_KEY` : Votre clé privée SSH (le contenu de `~/.ssh/id_rsa` ou `~/.ssh/id_ed25519`).
   * *(Optionnel)* `VPS_PORT` : `22` (ou votre port SSH personnalisé).

Désormais, dès que vous ferez un `git push origin main`, GitHub Actions déploiera la nouvelle version en moins d'une minute !

---

## 🔍 Commandes Utiles de Maintenance

* **Voir les logs de l'application en direct :**
  ```bash
  docker compose logs -f
  ```
* **Redémarrer manuellement l'application :**
  ```bash
  docker compose restart
  ```
* **Vérifier l'état du conteneur :**
  ```bash
  docker ps | grep studio_leonardkabo
  ```
