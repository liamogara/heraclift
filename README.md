# Heraclift

Heraclift is a personal fitness tracking web app for building workout routines, logging sessions with weight tracking, recording runs, tracking nutrition, and running fitness calculators. It's installable as a PWA, so it works like a native mobile app.

## Theme

The app is styled around Ancient Greece. The name comes from Heracles, the Greek hero renowned for his strength. His ascension to godhood through twelve labors makes a fitting namesake for a self-improvement app. The theme carries through the app's pages:

- **The Agora** — the dashboard/homepage, named after the central gathering place of a Greek city
- **Labors** — the training page, after Heracles' twelve labors
- **The Oracle** — the calculators page (one-rep max, TDEE, BMI), a nod to the priestesses who offered guidance and counsel

<a href="https://www.flaticon.com/free-icons/greek" title="greek icons">Greek icons created by max.icons - Flaticon</a>

## Stack

**Frontend** — [frontend/heraclift-web/](frontend/heraclift-web/)
- React  + TypeScript
- Vite
- Lucide icons

**Backend** — [backend/Heraclift.Api/](backend/Heraclift.Api/)
- ASP.NET Core (.NET 10) Web API
- Entity Framework Core with SQL Server
- JWT bearer authentication

**Deployment**
- GitHub Actions builds the frontend, bundles it into the API's `wwwroot`, and deploys the combined app to Azure App Service ([deploy.yml](.github/workflows/deploy.yml))

## Running locally

```sh
# Backend (from backend/Heraclift.Api)
dotnet run

# Frontend (from frontend/heraclift-web)
npm install
npm run dev
```
