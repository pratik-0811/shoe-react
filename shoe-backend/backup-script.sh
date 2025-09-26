#!/bin/bash

# MongoDB Backup Script for Production
# This script runs inside the backup container

set -e

# Configuration from environment variables
MONGO_HOST=${MONGO_HOST:-mongo}
MONGO_PORT=${MONGO_PORT:-27017}
MONGO_DB=${MONGO_DB:-shoe-store}
MONGO_USERNAME=${MONGO_USERNAME}
MONGO_PASSWORD=${MONGO_PASSWORD}
BACKUP_SCHEDULE=${BACKUP_SCHEDULE:-"0 2 * * *"}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
BACKUP_DIR="/backups"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup function
create_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/mongodb_backup_$timestamp.gz"
    
    log "Starting MongoDB backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create the backup
    if [ -n "$MONGO_USERNAME" ] && [ -n "$MONGO_PASSWORD" ]; then
        # With authentication
        mongodump \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --db "$MONGO_DB" \
            --username "$MONGO_USERNAME" \
            --password "$MONGO_PASSWORD" \
            --authenticationDatabase admin \
            --archive="$backup_file" \
            --gzip
    else
        # Without authentication
        mongodump \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --db "$MONGO_DB" \
            --archive="$backup_file" \
            --gzip
    fi
    
    if [ $? -eq 0 ]; then
        log "Backup created successfully: $backup_file"
        
        # Get backup size
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "Backup size: $backup_size"
        
        # Create a metadata file
        cat > "$backup_file.meta" << EOF
{
    "timestamp": "$timestamp",
    "database": "$MONGO_DB",
    "host": "$MONGO_HOST:$MONGO_PORT",
    "size": "$backup_size",
    "created_at": "$(date -Iseconds)",
    "retention_until": "$(date -d "+$BACKUP_RETENTION_DAYS days" -Iseconds)"
}
EOF
        
        log "Backup metadata created: $backup_file.meta"
    else
        log "ERROR: Backup failed!"
        exit 1
    fi
}

# Clean old backups function
clean_old_backups() {
    log "Cleaning old backups (older than $BACKUP_RETENTION_DAYS days)..."
    
    # Find and remove old backup files
    find "$BACKUP_DIR" -name "mongodb_backup_*.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "mongodb_backup_*.gz.meta" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    
    # Count remaining backups
    local remaining_backups=$(find "$BACKUP_DIR" -name "mongodb_backup_*.gz" -type f | wc -l)
    log "Cleanup completed. Remaining backups: $remaining_backups"
}

# Verify backup function
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file not found: $backup_file"
        return 1
    fi
    
    # Check if file is not empty
    if [ ! -s "$backup_file" ]; then
        log "ERROR: Backup file is empty: $backup_file"
        return 1
    fi
    
    # Test if gzip file is valid
    if ! gzip -t "$backup_file" 2>/dev/null; then
        log "ERROR: Backup file is corrupted: $backup_file"
        return 1
    fi
    
    log "Backup verification passed: $backup_file"
    return 0
}

# Restore backup function
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log "ERROR: No backup file specified for restore"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Starting MongoDB restore from: $backup_file"
    
    # Verify backup before restore
    if ! verify_backup "$backup_file"; then
        log "ERROR: Backup verification failed, aborting restore"
        exit 1
    fi
    
    # Perform restore
    if [ -n "$MONGO_USERNAME" ] && [ -n "$MONGO_PASSWORD" ]; then
        # With authentication
        mongorestore \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --db "$MONGO_DB" \
            --username "$MONGO_USERNAME" \
            --password "$MONGO_PASSWORD" \
            --authenticationDatabase admin \
            --archive="$backup_file" \
            --gzip \
            --drop
    else
        # Without authentication
        mongorestore \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --db "$MONGO_DB" \
            --archive="$backup_file" \
            --gzip \
            --drop
    fi
    
    if [ $? -eq 0 ]; then
        log "Restore completed successfully"
    else
        log "ERROR: Restore failed!"
        exit 1
    fi
}

# List backups function
list_backups() {
    log "Available backups:"
    
    for backup in $(find "$BACKUP_DIR" -name "mongodb_backup_*.gz" -type f | sort -r); do
        local backup_name=$(basename "$backup")
        local backup_size=$(du -h "$backup" | cut -f1)
        local backup_date=$(stat -c %y "$backup" | cut -d' ' -f1)
        
        echo "  $backup_name ($backup_size) - $backup_date"
        
        # Show metadata if available
        if [ -f "$backup.meta" ]; then
            local created_at=$(grep '"created_at"' "$backup.meta" | cut -d'"' -f4)
            echo "    Created: $created_at"
        fi
    done
}

# Install cron job
install_cron() {
    log "Installing cron job with schedule: $BACKUP_SCHEDULE"
    
    # Create cron job
    echo "$BACKUP_SCHEDULE /backup-script.sh backup >> /var/log/backup.log 2>&1" | crontab -
    
    log "Cron job installed successfully"
}

# Main execution
case "${1:-cron}" in
    "backup")
        create_backup
        clean_old_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "verify")
        verify_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "clean")
        clean_old_backups
        ;;
    "cron")
        log "Starting backup service with cron schedule: $BACKUP_SCHEDULE"
        install_cron
        
        # Start cron daemon
        cron -f
        ;;
    *)
        echo "Usage: $0 {backup|restore <file>|verify <file>|list|clean|cron}"
        echo "  backup  - Create a new backup"
        echo "  restore - Restore from backup file"
        echo "  verify  - Verify backup file integrity"
        echo "  list    - List available backups"
        echo "  clean   - Clean old backups"
        echo "  cron    - Start cron service (default)"
        exit 1
        ;;
esac