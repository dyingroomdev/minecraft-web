# AMZCraft Operations Runbook

## Purchase Lifecycle

### Normal Flow
1. **Customer Submission** (`POST /api/payments/bkash/submit`)
   - Validates rank exists and is active
   - Checks price tolerance (±5%)
   - Prevents duplicate transaction IDs
   - Rate limits per IP (3 requests/hour)
   - Creates `PaymentRequest` with status `pending`

2. **Admin Review** (`GET /admin/payments?status=pending`)
   - Admin reviews payment details and screenshot
   - Verifies bKash transaction manually

3. **Admin Approval** (`POST /admin/payments/:id/approve`)
   - Requires `Idempotency-Key` header
   - Updates status to `approved`
   - Enqueues fulfillment job in Redis

4. **Worker Fulfillment**
   - Worker picks up job from `fulfill_rank_queue`
   - Grants rank via RCON: `lp user <uuid> parent add <group>`
   - Creates `Entitlement` record
   - Updates status to `fulfilled`
   - Sends Discord notification

### Status Transitions
```
pending → approved → fulfilled
pending → rejected (terminal)
approved → failed (retry possible)
```

## Rollback Procedures

### Failed Payment Fulfillment
```bash
# 1. Check payment status
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/admin/payments?status=failed"

# 2. Retry fulfillment
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/admin/retry/{payment_request_id}"

# 3. Manual RCON if needed
docker compose exec worker python -c "
from worker.services import RCONService
from worker.config import get_worker_settings
settings = get_worker_settings()
rcon = RCONService(settings.minecraft_server_host, settings.minecraft_rcon_port, settings.minecraft_rcon_password)
await rcon.grant_rank('player-uuid', 'vip')
"
```

### Rank Removal (Refund)
```bash
# 1. Remove rank via RCON
docker compose exec api python -c "
from worker.services import RCONService
rcon = RCONService('localhost', 25575, 'password')
await rcon.remove_rank('player-uuid', 'vip')
"

# 2. Revoke entitlement
psql -h localhost -U postgres -d app -c "
UPDATE entitlements 
SET is_active = false, revoked_at = NOW() 
WHERE mc_uuid = 'player-uuid' AND rank_code = 'vip';
"

# 3. Update payment status
psql -h localhost -U postgres -d app -c "
UPDATE payment_requests 
SET status = 'refunded' 
WHERE id = 'payment-request-id';
"
```

## Social Media Updates

### Update Social Links
```bash
# Via API
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discord": "https://discord.gg/newlink",
    "twitter": "https://twitter.com/amzcraft",
    "youtube": "https://youtube.com/@amzcraft"
  }' \
  "http://localhost:8000/admin/social"

# Via Database
psql -h localhost -U postgres -d app -c "
INSERT INTO social_links (id, platform, url, display_order, created_at, updated_at) 
VALUES (gen_random_uuid(), 'DISCORD', 'https://discord.gg/newlink', 1, NOW(), NOW())
ON CONFLICT (platform) DO UPDATE SET url = EXCLUDED.url, updated_at = NOW();
"
```

### Cache Invalidation
```bash
# Clear social links cache
redis-cli -h localhost -p 6379 DEL "social_links"

# Clear all caches
redis-cli -h localhost -p 6379 FLUSHALL
```

## RCON Failure Handling

### Diagnostics
```bash
# Check RCON connectivity
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/admin/diagnostics"

# Manual RCON test
docker compose exec worker python -c "
import asyncio
from worker.services import RCONService
from worker.config import get_worker_settings

async def test_rcon():
    settings = get_worker_settings()
    rcon = RCONService(settings.minecraft_server_host, settings.minecraft_rcon_port, settings.minecraft_rcon_password)
    try:
        result = await rcon._execute_command('list')
        print(f'RCON Success: {result}')
    except Exception as e:
        print(f'RCON Failed: {e}')

asyncio.run(test_rcon())
"
```

### Common RCON Issues

#### Connection Refused
```bash
# Check if Minecraft server is running
docker compose logs minecraft

# Verify RCON is enabled in server.properties
grep -i rcon /path/to/minecraft/server.properties

# Test network connectivity
telnet localhost 25575
```

#### Authentication Failed
```bash
# Verify RCON password
echo $MINECRAFT_RCON_PASSWORD

# Update password in environment
sed -i 's/MINECRAFT_RCON_PASSWORD=.*/MINECRAFT_RCON_PASSWORD=newpassword/' .env
docker compose restart worker
```

#### Command Failures
```bash
# Check LuckPerms is installed
docker compose exec minecraft rcon-cli "lp info"

# Verify group exists
docker compose exec minecraft rcon-cli "lp listgroups"

# Create missing group
docker compose exec minecraft rcon-cli "lp creategroup vip"
```

### Recovery Procedures

#### Failed Rank Grants
1. **Check DLQ**: `redis-cli LLEN fulfill_rank_dlq`
2. **Manual Processing**:
   ```bash
   # Get failed payment ID
   PAYMENT_ID=$(redis-cli RPOP fulfill_rank_dlq)
   
   # Retry via API
   curl -X POST -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/admin/retry/$PAYMENT_ID"
   ```

#### Bulk Rank Fixes
```sql
-- Find unfulfilled approved payments
SELECT pr.id, pr.mc_username, rp.luckperms_group, pr.created_at
FROM payment_requests pr
JOIN rank_products rp ON pr.rank_product_id = rp.id
WHERE pr.status = 'approved' 
  AND pr.created_at < NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (
    SELECT 1 FROM entitlements e 
    WHERE e.payment_request_id = pr.id
  );

-- Mark as failed for retry
UPDATE payment_requests 
SET status = 'failed' 
WHERE status = 'approved' 
  AND created_at < NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (
    SELECT 1 FROM entitlements e 
    WHERE e.payment_request_id = payment_requests.id
  );
```

## Monitoring & Alerts

### Health Checks
```bash
# API health
curl http://localhost:8000/health

# Database connectivity
psql -h localhost -U postgres -d app -c "SELECT 1;"

# Redis connectivity
redis-cli -h localhost -p 6379 ping

# Worker queue status
redis-cli -h localhost -p 6379 LLEN fulfill_rank_queue
redis-cli -h localhost -p 6379 LLEN fulfill_rank_dlq
```

### Log Analysis
```bash
# Payment failures
docker compose logs api | grep -i "payment.*error"

# RCON failures
docker compose logs worker | grep -i "rcon.*failed"

# Queue processing
docker compose logs worker | grep "fulfill_rank"

# Rate limiting
docker compose logs api | grep "rate limit"
```

### Performance Metrics
```bash
# Database connections
psql -h localhost -U postgres -d app -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
"

# Redis memory usage
redis-cli -h localhost -p 6379 INFO memory | grep used_memory_human

# Payment processing times
psql -h localhost -U postgres -d app -c "
SELECT 
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM payment_requests 
WHERE processed_at IS NOT NULL 
  AND created_at > NOW() - INTERVAL '24 hours';
"
```

## Emergency Procedures

### System Down
1. **Check all services**: `docker compose ps`
2. **Restart stack**: `docker compose down && docker compose up -d`
3. **Check logs**: `docker compose logs -f`
4. **Verify connectivity**: Run diagnostics endpoint

### Database Issues
1. **Backup**: `pg_dump -h localhost -U postgres app > backup.sql`
2. **Check connections**: `docker compose logs db`
3. **Restart DB**: `docker compose restart db`
4. **Restore if needed**: `psql -h localhost -U postgres app < backup.sql`

### Payment Queue Stuck
1. **Check queue length**: `redis-cli LLEN fulfill_rank_queue`
2. **Clear queue**: `redis-cli DEL fulfill_rank_queue`
3. **Restart worker**: `docker compose restart worker`
4. **Re-enqueue failed payments**: Use retry endpoint

### Security Incident
1. **Rotate JWT secret**: Update `JWT_SECRET` in `.env`
2. **Restart API**: `docker compose restart api`
3. **Revoke all sessions**: `redis-cli FLUSHALL`
4. **Check audit logs**: Export via `/admin/audit/export`