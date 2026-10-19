# Business Performance & Revenue Analytics Dashboard

An interactive admin dashboard to track leads, quotations, deals, orders and revenue.
Built with plain HTML, CSS and JavaScript. Charts use [Chart.js](https://www.chartjs.org/) (loaded from cdnjs).
All data is dummy data generated in the browser, so no backend or database is needed.

**Live demo:** `https://<your-username>.github.io/business-dashboard/`

## Features

**Lead analytics**
- KPI cards: new, qualified, converted and unqualified leads, conversion rate, quotations, deals and invoices
- Lead funnel, daily lead trend, lead sources and lead source trend

**Filters**
- Today, Last 7 Days, Last 30 Days and a custom date range
- User and department filters
- Every KPI shows the % increase or decrease against the previous equal period
- All charts, tables and cards update with the filters

**Quotation analytics**
- Quotations by service, quotation value, service wise details and quotation status
- Lead wise history and quote to deal conversion rate

**Deals and revenue**
- Deals and revenue by service, revenue by category, priority breakdown
- Daily revenue trend, total vs collected vs outstanding revenue, deal progress
- Monthly target achievement

**Orders and payments**
- Order status and stage progress, completed orders
- Payment history and collection trend
- Sales team and operations team activity, recent CRM activity

**Drill-downs and export**
- Lead -> its quotations and deals
- Deal -> its orders and payments
- Service -> its quotations
- Export button downloads the filtered data as a CSV file

## Data relationships

- One lead can have multiple quotations and deals
- One deal can have multiple orders and payments

## Project structure

```
index.html   page structure
style.css    styles and responsive layout
script.js    dummy data, filters, charts, drill downs, export
```

## Run locally

Open `index.html` in a browser. An internet connection is needed to load Chart.js from cdnjs.

## Deploy with GitHub Pages

1. Push the files to a public GitHub repository, with `index.html` in the root.
2. Open Settings -> Pages.
3. Set the source to "Deploy from a branch", choose `main` and `/ (root)`, then save.
4. The site goes live at `https://<your-username>.github.io/<repo-name>/` after about a minute.

## Notes

- The dummy data is seeded, so the numbers are the same on every reload.
- The dummy data covers the 90 days up to 19 Oct 2026.
- The monthly revenue target is set to Rs 85,00,000 in `script.js` (`MONTHLY_TARGET`).
