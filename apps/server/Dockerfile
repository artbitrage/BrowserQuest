FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build --filter @bq/server...

FROM base AS prod
COPY --from=build /usr/src/app/apps/server/dist /app/dist
COPY --from=build /usr/src/app/node_modules /app/node_modules
COPY --from=build /usr/src/app/apps/server/package.json /app/package.json
WORKDIR /app
EXPOSE 8000
CMD [ "node", "dist/main.js" ]
