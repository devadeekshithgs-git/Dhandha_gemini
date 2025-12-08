# Fixing Login Redirect on Vercel

The error you are seeing (`ERR_CONNECTION_REFUSED` on `localhost:3000`) happens because Supabase is redirecting you back to `localhost` after login, even though you started login from Vercel.

This occurs because your Vercel URL is not added to the **Redirect URLs** in your Supabase project settings. For security reasons, Supabase only redirects to whitelisted URLs. If a URL is not whitelisted, it falls back to the default "Site URL" (which is likely set to `http://localhost:3000`).

## One-Time Fix (Required)

You must explicitly add your Vercel deployment URL to Supabase. This cannot be done from code.

1.  **Open Supabase Dashboard**: Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and select your project.
2.  **Go to Auth Settings**: Click on the **Authentication** icon in the left sidebar.
3.  **URL Configuration**: Click on **URL Configuration** under the Configuration section.
4.  **Add Redirect URL**:
    *   Find the **Redirect URLs** section.
    *   Click **Add URL**.
    *   Enter your specific Vercel URL (e.g., `https://dhandha.vercel.app`).
    *   **CRITICAL**: Also add the wildcard version if you have preview deployments: `https://*-dhandha.vercel.app` (replace `dhandha` with your actual project user/team name if different).
    *   Also ensure `http://localhost:3000` is still there for local development.
5.  **Save**: Click **Save**.

## Why this happens?
The code `redirectTo: window.location.origin` in `Login.tsx` sends the header:
*   Sends `https://dhandha.vercel.app` when you are on Vercel.
*   Sends `http://localhost:3000` when you are on Localhost.

If `https://dhandha.vercel.app` is not in the whitelist, Supabase ignores it and uses the default Site URL (`localhost`), causing the error on your mobile device (since `localhost` on a phone refers to the phone itself, not the web server).
