## SUPER QUICK: How to View This Page

You can’t double-click `index.html` anymore — you need to run a tiny local server.

Pick **ONE** of the options below:

---

### Option A — Python

1. Open **Terminal** (macOS/Linux) or **Command Prompt** (Windows).
2. Go into the folder where you downloaded the project. Example:
   ```bash
   cd ~/Downloads/RavonDev
   ```
   **⚠️ Don’t copy this exact path.** Change it to wherever *you* saved the folder (e.g., `Desktop`, `Documents`, etc.).
3. Start the server:
   ```bash
   python -m http.server 8000
   ```
4. Open your browser and go to **http://localhost:8000**
5. Press **Ctrl + C** in the terminal to stop the server when you're finished.

---

### Option B — Node.js

1. Open **Terminal** or **Command Prompt**.
2. Go into the folder where you downloaded the project. Example:
   ```bash
   cd ~/Downloads/RavonDev
   ```
   **⚠️ Use your actual folder path.**
3. Start the server:
   ```bash
   npx serve .
   ```
4. Open the link the command prints (usually **http://localhost:8000** or **3000**).
5. Press **Ctrl + C** to stop the server when you're done.




## 🙏 Credits & Inspiration

I was able to create this effect thanks to the incredible work and open-source implementations from the creators below.
I borrowed ideas and code from their projects, and I’m grateful I found their work instead of reinventing the wheel.
Huge thanks to them for sharing these resources, they saved me a lot of time and helped make this project possible.

- https://aleclownes.com/2017/02/01/crt-display.html
- https://github.com/staltz/hyperpunk
- https://codepen.io/lbebber/pen/XJRdrV
- https://github.com/HairyDuck/terminal
- https://codepen.io/njbair/pen/ZVPomJ
- https://codepen.io/meduzen/pen/zxbwRV 

## Deployment & Security (No Secrets in Repo)

- This site is mostly static, with Vercel serverless functions for lead intake.
- Do not hardcode credentials or tokens anywhere in `js/` or `index.html`.
- If you ever add backend calls, keep secrets in your platform env (e.g., Vercel Project Settings → Environment Variables) and never commit them.
- Local-only artifacts are ignored via `.gitignore` and excluded from deployments via `.vercelignore` (e.g., `.server/`, `server.pid`, `*.log`, and `img/family/`).
- Contact email lives in `js/config.js` as `CONTACT_EMAIL`. It remains public only as a fallback contact path.

## Contact Intake (Vercel + Supabase)

- The `contact` terminal command now posts to `/api/inquiries`.
- The Vercel function stores submissions in Supabase using a service-role key that must live only in Vercel environment variables.
- Required Vercel environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_INQUIRIES_TABLE` (optional, defaults to `crt_contact_requests`)

### Supabase setup

Run the SQL in `supabase/crt_contact_requests.sql`.

That creates the intake table and locks it down so only the service-role key can write to it.

### Verify env on Vercel

- A serverless health check is available at `/api/health`.
- It returns JSON `{ ok: true, configured: <boolean>, table: <string> }` without revealing secrets.
