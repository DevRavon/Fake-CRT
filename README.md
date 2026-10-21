# Ravon.dev

Ravon's personal website offers two ways to explore: an Ubuntu-inspired desktop and an interactive terminal. Both lead to the same projects, toolkit, games, and contact form.

Visitors choose Desktop or Terminal at entry and can switch later. The desktop has draggable application windows, an app launcher, Files, games, and a windowed Terminal. Files and Terminal share folder paths and a local `notes.txt`; the editor saves notes only in the visitor's browser. Try `help`, `ls`, `cd projects`, `cat ravon.dev.txt`, `neofetch`, `nano /notes.txt`, and `open /pictures/matrix.svg` in Terminal.

The frontend uses plain HTML, CSS, and JavaScript. Vercel serves the static site and the contact function in `api/contact.js`.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. The interface works locally; the contact form requires a Vercel function and Resend configuration.

## Contact delivery

Configure these **server-side** environment variables in Vercel:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_NOTIFICATION_FROM` | Verified sender, for example `Ravon <contact@ravon.dev>` |
| `CONTACT_NOTIFICATION_TO` | Inbox that receives messages |

The function also accepts `RESEND_FROM_EMAIL` and `CONTACT_TO_EMAIL` as alternate names. If a required setting is missing or Resend rejects the request, the form gives a truthful error and offers the public email address. No key is included in browser code, and contact details are not stored in local storage.

The sending domain must be verified in Resend. Preview deployments require their own appropriately scoped environment settings to test email delivery; production settings do not automatically apply to previews.

## Checks

```bash
npm test
node --check js/site.js
```

Review desktop, terminal, contact, and games in a browser at desktop and phone widths. A successful server response should be shown only after Resend accepts a message.

## Credits

The original CRT terminal was created with contributions from [davislcruz](https://github.com/davislcruz). The desktop interaction was informed by the [Awesome Web Desktops](https://github.com/syxanash/awesome-web-desktops) collection, especially its portfolio and file manager examples. This redesign retains the terminal idea while making the site easier to browse and contact Ravon.
