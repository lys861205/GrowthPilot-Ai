# Alibaba Cloud Deployment Proof

GrowthPilot AI is fully deployed on Alibaba Cloud infrastructure.

## Services Used

### 1. Alibaba Cloud ECS (Elastic Compute Service)
- **Instance type**: ecs.e-c1m1.large (2 vCPU / 2GB RAM)
- **OS**: Ubuntu 26.04 64
- **Region**: Singapore
- The entire application stack runs on ECS via Docker + Nginx

### 2. Qwen API via DashScope (Alibaba Cloud AI)
- **Endpoint**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- **Model**: `qwen3.7-plus`
- All AI features (SEO suggestions, blog generation, trend analysis, action plans) are powered by Qwen

## Code References

| Feature | File | Alibaba Cloud Service |
|---------|------|-----------------------|
| Qwen AI client | [`src/lib/qwen/client.ts`](./src/lib/qwen/client.ts) | DashScope API |
| SEO suggestions | [`src/lib/qwen/suggestions.ts`](./src/lib/qwen/suggestions.ts) | Qwen inference |
| Blog Agent | [`src/lib/qwen/blog-agent.ts`](./src/lib/qwen/blog-agent.ts) | Qwen inference |
| Action Plan | [`src/lib/qwen/action-plan.ts`](./src/lib/qwen/action-plan.ts) | Qwen inference |
| Growth recs | [`src/lib/qwen/growth.ts`](./src/lib/qwen/growth.ts) | Qwen inference |
| Trend analysis | [`src/lib/qwen/trend-analysis.ts`](./src/lib/qwen/trend-analysis.ts) | Qwen inference |
| Docker deployment | [`Dockerfile`](./Dockerfile) | Runs on ECS |
| Full stack compose | [`docker-compose.yml`](./docker-compose.yml) | Runs on ECS |
| Nginx proxy | Configured on ECS at `/etc/nginx/conf.d/growthpilot.conf` | ECS network |

## Environment Configuration

```env
QWEN_API_KEY=sk-***               # DashScope API Key
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.7-plus
```

## Architecture

All backend services (Next.js app, audit worker, blog agent worker, GSC sync worker) run inside Docker containers managed by `supervisord` on a single Alibaba Cloud ECS instance, fronted by Nginx as a reverse proxy.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.
