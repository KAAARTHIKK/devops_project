local bucketKey = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillPerSec = tonumber(ARGV[2])
local nowMs = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local data = redis.call('HMGET', bucketKey, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local last = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  last = nowMs
end

local elapsed = math.max(0, nowMs - last) / 1000
tokens = math.min(capacity, tokens + elapsed * refillPerSec)

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call('HSET', bucketKey, 'tokens', tokens, 'lastRefill', nowMs)
redis.call('PEXPIRE', bucketKey, 3600000)

local retryAfter = 0
if allowed == 0 then
  if refillPerSec > 0 then
    retryAfter = math.ceil((cost - tokens) / refillPerSec)
  else
    retryAfter = -1 -- bucket never refills; caller should treat as "unknown"
  end
end

return { allowed, math.floor(tokens), retryAfter }
