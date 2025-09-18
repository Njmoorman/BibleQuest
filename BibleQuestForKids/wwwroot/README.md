# Base44 App


This app was created automatically by Base44.
It's a Vite+React app that communicates with the Base44 API.

## Running the app

```bash
npm install
npm run dev
```

## Building the app for .NET MAUI

```bash
npm run build
```

This command outputs production assets into `wwwroot/dist`. The .NET MAUI
project bundles everything in that folder as `MauiAsset` items and copies the
folder to local storage when the app loads. Codemagic also runs `npm ci` and
`npm run build` during iOS builds so TestFlight and App Store submissions always
ship the latest React bundle.

For more information and support, please contact Base44 support at
app@base44.com.
