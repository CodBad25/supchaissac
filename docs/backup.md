# Sauvegarde et récupération — SupChaissac v2

## Base de données (Neon PostgreSQL)

### Sauvegarde manuelle
```bash
# Export complet
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc -f backup_$(date +%Y%m%d).dump

# Export SQL lisible
pg_dump "$DATABASE_URL" --no-owner --no-acl -f backup_$(date +%Y%m%d).sql
```

### Restauration
```bash
# Depuis un dump
pg_restore -d "$DATABASE_URL" --no-owner --clean --if-exists backup_20260228.dump

# Depuis un SQL
psql "$DATABASE_URL" < backup_20260228.sql
```

### Sauvegarde vers S3 Scaleway
```bash
# Backup + upload vers S3
pg_dump "$DATABASE_URL" --no-owner -Fc -f /tmp/backup.dump
aws s3 cp /tmp/backup.dump s3://$S3_BUCKET/backups/backup_$(date +%Y%m%d).dump \
  --endpoint-url https://s3.fr-par.scw.cloud
rm /tmp/backup.dump
```

### Automatisation (cron)
```bash
# Ajouter dans crontab -e (sauvegarde quotidienne à 2h du matin)
0 2 * * * /path/to/backup-script.sh >> /var/log/backup.log 2>&1
```

## Fichiers S3 (Scaleway Object Storage)

Les pièces jointes sont stockées sur S3 Scaleway (`s3.fr-par.scw.cloud`).

### Synchronisation locale
```bash
aws s3 sync s3://$S3_BUCKET ./backup-s3/ --endpoint-url https://s3.fr-par.scw.cloud
```

## Plan de récupération

1. **Base de données** : restaurer le dernier dump depuis S3
2. **Fichiers** : les pièces jointes restent sur S3 (pas de perte sauf suppression manuelle)
3. **Code** : redéployer depuis GitHub (`git pull && npm run build`)
4. **Sessions utilisateur** : seront invalidées (les utilisateurs devront se reconnecter)
