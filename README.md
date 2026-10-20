# Lobna Maalej — Web Developer & Data Solutions

A French-first, responsive portfolio with a React/Vite frontend, Express API, MongoDB persistence, and a private single-admin content studio. The UI also supports English, Brazilian Portuguese, and Spanish.

## Features

- Portfolio focused on Printer Store, Travel Platform, and Power BI first.
- Sponsorship Management and Solar Energy remain hidden on the public homepage until the administrator publishes them; Pharma & Skincare is a draft. There is no public “Coming soon” section.
- Four-language UI switcher; project titles, descriptions, feature lists, and pricing labels can be entered separately for FR / EN / PT-BR / ES.
- Project CRUD: add, edit, delete, publish, draft, reorder, feature, and categorize projects.
- Project media uploads (JPG, PNG, WEBP, AVIF, GIF; 12 MB per image by default), video URL, live-demo URL, GitHub URL, and documentation URL are independent fields.
- The public “Live demo” link only appears when an administrator has supplied a valid HTTP(S) demo URL. GitHub and documentation links do not masquerade as a live demo.
- Public admin sign-in only; there is deliberately no public sign-up / registration endpoint.
- Password comes from server environment configuration; login attempts are rate-limited; admin API routes require a signed JWT.
- Responsive layouts, motion details, loading state, reduced-motion support, and useMemo for project filtering / derived collections.

## Requirements

- Node.js 20.19+ (Node 22/24 is recommended)
- npm 10+
- MongoDB locally, or a MongoDB Atlas connection string

## Run locally (Windows PowerShell)

1. Open a terminal in this project folder.
2. Install dependencies:

   ```powershell
   npm install
   ```

3. Create the server environment file. Run the command that matches your current terminal folder:

   From the project root:
   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   If your terminal is already inside the `server` folder:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Open `server/.env` and set:
   - `MONGO_URI` to your local MongoDB URI or MongoDB Atlas URI.
   - `ADMIN_EMAIL` to the one administrator email.
   - `ADMIN_PASSWORD` to a strong private password.
   - `JWT_SECRET` to a random secret of at least 32 characters.

   Do not commit `server/.env` to GitHub. The example values are only for local setup and must be changed before any public deployment.

5. Start the site and API together:

   ```powershell
   npm run dev
   ```

6. Open `http://localhost:5173`. The API runs at `http://localhost:5000`.
7. To access the private CMS, choose **Admin** in the header and use the email/password configured in `server/.env`. No other visitor can create an account.

When MongoDB connects for the first time, the app inserts six editable starter entries. If the database already contains projects, seeding is skipped to avoid overwriting existing content. You can manually run `npm run seed` to seed an empty database.

## Production build

```powershell
npm run build
npm start
```

The Express server serves `client/dist` after a production build. Set `NODE_ENV=production`, `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a strong `JWT_SECRET` in the hosting provider's environment settings.

## Media storage and hosting note

Uploaded files are stored under `server/uploads` on the server filesystem. This works for local development or a host with persistent disk. Some serverless hosting environments do not preserve local uploads across deployments or instances; for such hosting, migrate media storage to Cloudinary, S3, or another persistent object store before relying on it in production. MongoDB stores project data and the media URL/path; it does not store image bytes.

## Initial project data

| Portfolio item | Initial status | Repository / documentation |
|---|---|---|
| Printer Store | Published, featured | `Dev_Commerce_Lobna` + `explication_code_printers` |
| Travel Platform | Published, featured | `voyage` + `explication_code_voyage` |
| Power BI Business Intelligence | Published, featured | No dedicated repository identified in the supplied links; add the real demo / evidence in admin |
| Sponsorship Management | Hidden until published | `sponsoring` + `explication_code_sponsoring` |
| Solar Energy | Hidden until published | `solaire` + `explication_code_solaire` |
| Pharma & Skincare | Draft | `pharma_skinecare` + `explication_code_pharma_skinecare` |

The descriptions are editable starter copy based on the engagement brief; validate technical claims, final project details, and any actual demo/video URLs with the client before launch. Sponsorship and Solar remain available to the admin but are not presented in a separate Coming Soon section.
