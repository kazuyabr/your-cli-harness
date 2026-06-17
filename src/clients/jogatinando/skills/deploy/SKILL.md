---
name: deploy
description: Deploy application to production with full validation
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(npm *) Bash(docker *) Bash(kubectl *)
context: fork
---

Deploy $ARGUMENTS to production:

1. Run test suite: `npm test`
2. Build: `npm run build`
3. Docker build: `docker build -t jogatinando:$ARGUMENTS .`
4. Push: `docker push registry/jogatinando:$ARGUMENTS`
5. Deploy: `kubectl set image deployment/jogatinando jogatinando=registry/jogatinando:$ARGUMENTS`
6. Verify: `kubectl rollout status deployment/jogatinando`
7. Report results
