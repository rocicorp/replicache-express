const serverEnvVars = {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  url: process.env.SUPABASE_URL!,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  dbpass: process.env.SUPABASE_DATABASE_PASSWORD!,
};

export type SupabaseServerConfig = typeof serverEnvVars;

export function getSupabaseServerConfig() {
  return validate(serverEnvVars);
}

function validate<T extends Record<string, string>>(vars: T) {
  const enabled = Object.values(vars).some((v) => v);
  if (!enabled) {
    return undefined;
  }
  for (const [k, v] of Object.entries(vars)) {
    if (!v) {
      throw new Error(
        `Invalid Supabase config: SUPABASE_URL, and SUPABASE_DATABASE_PASSWORD must be set (${k} was not)`
      );
    }
  }
  return vars;
}
