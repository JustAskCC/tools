# Give Sunny a brain (about 10 minutes)

Sunny's app lives on GitHub Pages, which can only show pages. To think, Sunny needs a tiny free server that holds your Anthropic API key in secret and talks to Claude. That server is the file `worker.js` in this folder, running on Cloudflare Workers (free plan).

## 1. Get an Anthropic API key

1. Go to **console.anthropic.com** and sign in.
2. Open **Billing** and add a small amount of credit (for example $5 or $10).
3. Open **Limits** and set a **monthly spend limit** you are comfortable with. This is your safety net.
4. Open **API Keys**, click **Create Key**, name it `sunny`, and copy it. Keep it private.

## 2. Create the Worker

1. Go to **dash.cloudflare.com** and make a free account.
2. Click **Workers and Pages**, then **Create**, then **Create Worker**.
3. Name it `sunny-brain` and click **Deploy**.
4. Click **Edit code**. Delete everything in the editor, paste in all of `worker.js`, and click **Deploy**.

## 3. Add the secret key

1. In your Worker, open **Settings**, then **Variables and Secrets**.
2. Click **Add**, choose type **Secret**, name it exactly `ANTHROPIC_API_KEY`, and paste your key.
3. Click **Deploy**.

## 4. Connect the app

1. Copy your Worker's address. It looks like `https://sunny-brain.YOURNAME.workers.dev`.
2. On GitHub, open `sunny/app.js`, click the pencil, and paste the address between the quotes on this line:
   `const BRAIN_URL = '';`
3. Click **Commit changes**. In a minute or two, Sunny can think.

## Using a different website?

If you copied these tools to your own site, change the address in `ALLOWED_ORIGINS` near the top of `worker.js` to your site's address. The Worker only answers requests from the sites listed there.
