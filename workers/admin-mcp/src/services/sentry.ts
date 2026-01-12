import { Context, Effect, Layer, Schema } from "effect";

export interface SentryIssue {
  id: string;
  title: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  permalink: string;
}

export interface SentryServiceInterface {
  readonly getRecentIssues: (project: string) => Effect.Effect<SentryIssue[], Error>;
}

export class SentryService extends Context.Tag("SentryService")<
  SentryService,
  SentryServiceInterface
>() {}

function makeSentryService(authToken: string, org: string): SentryServiceInterface {
  return {
    getRecentIssues: (project) =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(
            `https://sentry.io/api/0/projects/${org}/${project}/issues/?query=is:unresolved&statsPeriod=24h`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Sentry API error: ${response.statusText}`);
          }

          const issues = (await response.json()) as any[];
          return issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            count: issue.count,
            userCount: issue.userCount,
            firstSeen: issue.firstSeen,
            lastSeen: issue.lastSeen,
            status: issue.status,
            permalink: issue.permalink,
          }));
        },
        catch: (error) => error as Error,
      }),
  };
}

export function makeSentryServiceLayer(authToken: string, org: string): Layer.Layer<SentryService> {
  return Layer.succeed(SentryService, makeSentryService(authToken, org));
}
