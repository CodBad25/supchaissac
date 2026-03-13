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

### Sauvegarde vers stockage externe
```bash
# Backup + copie vers le VPS
pg_dump "$DATABASE_URL" --no-owner -Fc -f /tmp/backup.dump
scp -i ~/.ssh/supchaissac_vps /tmp/backup.dump ubuntu@89.168.61.230:/backups/db/backup_$(date +%Y%m%d).dump
rm /tmp/backup.dump
```

### Automatisation (cron)
```bash
# Ajouter dans crontab -e (sauvegarde quotidienne à 2h du matin)
0 2 * * * /path/to/backup-script.sh >> /var/log/backup.log 2>&1
```

## Fichiers (Stockage local)

Les pièces jointes sont stockées sur le VPS Oracle Cloud (89.168.61.230) dans `/app/uploads` via volume Docker.

### Synchronisation locale
```bash
# Télécharger les fichiers depuis le VPS
rsync -avz -e "ssh -i ~/.ssh/supchaissac_vps" ubuntu@89.168.61.230:/app/uploads ./backup-uploads/
```

## Plan de récupération

1. **Base de données** : restaurer le dernier dump depuis le VPS
   ```bash
   scp -i ~/.ssh/supchaissac_vps ubuntu@89.168.61.230:/backups/db/backup_20260313.dump /tmp/
   pg_restore -d "$DATABASE_URL" --no-owner --clean --if-exists /tmp/backup_20260313.dump
   ```

2. **Fichiers** : les pièces jointes sont dans `/app/uploads` sur le VPS
   ```bash
   rsync -avz -e "ssh -i ~/.ssh/supchaissac_vps" ubuntu@89.168.61.230:/app/uploads ./restore-uploads/
   ```

3. **Code** : redéployer depuis GitHub (`git pull && npm run build`)

4. **Sessions utilisateur** : seront invalidées (les utilisateurs devront se reconnecter)
