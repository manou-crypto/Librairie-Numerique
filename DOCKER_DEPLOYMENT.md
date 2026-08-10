# 🐳 Docker Deployment Guide

## 📋 Pré-requis

- **Docker** 20.10+ et **Docker Compose** 2.0+
- **Ports disponibles** : 80 (Nginx), 3306 (MySQL)
- **Espace disque** : ~3GB minimum

## 🚀 Démarrage Rapide

### 1. Configuration

```bash
# Copier le fichier de configuration
cp .env.example .env

# Éditer les secrets (générer des clés JWT sécurisées)
# Linux/Mac:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Lancement avec Docker Compose

**Linux/Mac :**
```bash
./start.sh up
# ou
docker compose up -d --build
```

**Windows :**
```cmd

:: ou
docker compose up -d --build
```

### 3. Vérifier l'état des services

```bash
./start.sh status
# ou
docker compose ps
```

## 🌐 Accès à l'Application

| Service | URL | Détails |
|---------|-----|---------|
| **Application Complète** | http://localhost | Via Nginx reverse proxy |
| **API Backend** | http://localhost/api | NestJS (port 3000 interne) |
| **Base de Données** | localhost:3306 | MySQL 8.0 |

### Identifiants de Connexion

- **Email** : `admin@librairie.ci`
- **Mot de passe** : `admin123` (Remplacer en production!)

## 📊 Consultation des Logs

```bash
# Tous les logs
./start.sh logs

# Logs d'un service spécifique
./start.sh logs backend
./start.sh logs frontend
./start.sh logs mysql
./start.sh logs nginx
```

## 🛑 Arrêt et Nettoyage

```bash
# Arrêter les services (garder les volumes)
./start.sh down

# Arrêter et supprimer les volumes (réinitialiser la base)
./start.sh clean

# Redémarrer les services
./start.sh restart
```

## 🔒 Sécurité & Recommandations Production

### 1. Secrets & Variables d'Environnement

⚠️ **JAMAIS** commiter le fichier `.env` en production !

```bash
# Générer des secrets sécurisés
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Base de Données

- La base MySQL est maintenant **bindée sur 127.0.0.1 uniquement**
- Changer `MYSQL_ROOT_PASSWORD` dans `.env`
- Ajouter un utilisateur dédié (pas root) pour l'application

### 3. HTTPS / SSL

Pour activer HTTPS, créer les certificats SSL :

```bash
mkdir -p nginx/ssl
# Ajouter les certificats : nginx/ssl/cert.pem et nginx/ssl/key.pem
```

Puis éditer `nginx/default.conf` pour ajouter :

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of config
}

# Redirection HTTP -> HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### 4. Limites de Ressources

Les services ont des limites de RAM configurées :

- **MySQL** : 1GB
- **Backend** : 512MB
- **Frontend** : 512MB
- **Nginx** : 256MB

Adapter selon les besoins dans `docker-compose.yml`.

## 🏥 Healthchecks

Tous les services incluent des healthchecks automatiques :

```bash
# Vérifier l'état des healthchecks
docker compose ps

# Voir les détails d'un service
docker inspect <container_name> | grep -A 10 HealthCheck
```

## 📈 Monitoring & Logs

Les logs sont configurés pour :
- **Taille max** : 10MB par fichier
- **Nombre de fichiers** : 3 (rotation)
- **Format** : JSON (compatible ELK, Datadog, etc.)

Pour envoyer les logs ailleurs :

```yaml
logging:
  driver: "splunk"  # ou "awslogs", "gcplogs", etc.
  options:
    splunk-token: "your-token"
    splunk-url: "https://your-splunk-instance.com"
```

## 🔄 Mise à Jour de l'Application

```bash
# Récupérer les dernières images
docker compose pull

# Rebuild l'application
./start.sh build

# Redémarrer avec les nouvelles images
./start.sh up
```

## 🐛 Dépannage

### Erreur de connexion à MySQL

```bash
docker compose logs mysql
# Vérifier que le service est sain
docker compose ps mysql
```

### Le backend ne démarre pas

```bash
docker compose logs backend
# Vérifier la migration Prisma
docker compose exec backend npx prisma migrate deploy
```

### Le frontend ne charge pas

```bash
docker compose logs frontend
# Vérifier la construction Next.js
docker compose exec frontend npm run build
```

### Réinitialiser complètement

```bash
./start.sh clean
docker system prune -a
./start.sh build
./start.sh up
```

## 📚 Ressources Utiles

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## ✅ Checklist Avant Production

- [ ] Changer tous les mots de passe par défaut
- [ ] Générer des secrets JWT sécurisés
- [ ] Activer HTTPS avec certificats valides
- [ ] Configurer un backup automatique de la base de données
- [ ] Mettre en place un système de monitoring (Prometheus, Datadog, etc.)
- [ ] Configurer les logs centralisés (ELK, Splunk, etc.)
- [ ] Tester les healthchecks et la résilience
- [ ] Configurer les ressources (CPU, RAM) selon la charge
- [ ] Implémenter une stratégie de disaster recovery
- [ ] Documenter le processus de déploiement
