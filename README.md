# Based Management Website

This is the commented source copy of the Based Management website, including the Pittsburgh aerial, rental application link, and staging contact form.

## Edit and preview

Open this folder in VS Code. Start with `index.html` for copy and links, `css/styles.css` for layout and colors, and `js/site.js` for interactive behavior. The comments explain the source beside the lines they describe.

Run these commands from this folder to preview the frontend locally.

```powershell
npm ci
npm run dev
```

Open the URL printed in the terminal. The local Vite server serves the form interface. To send a real inquiry, use the existing AWS staging site.

## Upload to GitHub

Create an empty repository in the intended GitHub account. In the repository, choose **Add file → Upload files**, then upload the contents of this folder while preserving the subfolders. Include the hidden `.gitignore` file. The repository root should contain `index.html`, `package.json`, and the `assets`, `css`, `functions`, and `js` folders.

If you use Git from a terminal, run the commands below and replace the example URL with your repository URL.

```powershell
git init -b main
git add .
git commit -m "Add Based Management website"
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git push -u origin main
```

GitHub stores the source. The public staging website is deployed through AWS Amplify.

## Build for existing AWS staging

```powershell
$env:BASED_CONTACT_ENDPOINT = 'https://iru7l2fawl.execute-api.us-east-1.amazonaws.com/api/contact'
npm run build
```

Vite outputs the site to `dist`. For a manual Amplify update, ZIP the contents of `dist` so that `index.html` is at the root of the ZIP. The API Gateway endpoint above is public configuration. The Lambda function uses an AWS role to send via SES, so the build needs no email password or private key.

The current contact backend accepts the Amplify staging origin and delivers only to `office@basedmgt.com`. Before moving the site to another domain, update the allowed origin in both the Lambda code and API Gateway settings in `aws-contact.yml`, deploy the updated stack, and test the form from the new origin.

The separate `functions/api/contact.js` handler is for Cloudflare Pages and uses Resend. It requires a verified sender plus the host-provided `CONTACT_FROM_EMAIL` and `RESEND_API_KEY` variables if deployed there.

## Package files

`package.json` lists the project name, scripts, and Vite development dependency. `dev` starts Vite, `build` produces the deployable files, and `preview` serves a completed build locally. The `test` script is the default placeholder until a test suite is added. `package-lock.json` records the exact installed dependency tree for `npm ci`. Both files use strict JSON and should stay comment-free.
