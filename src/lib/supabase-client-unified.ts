import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RequestCookies {
  get(name: string): { name: string; value: string } | undefined;
  getAll(name?: string): { name: string; value: string }[];
  has(name: string): boolean;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string | string[]): void;
  [Symbol.iterator](): IterableIterator<{ name: string; value: string }>;
}

export function createClientComponentClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function createServerComponentClient(cookies: RequestCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookies.set(name, "", options);
      },
    },
  });
}
