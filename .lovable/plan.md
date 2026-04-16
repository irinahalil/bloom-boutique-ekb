

# Plan: Revenue Dashboard in Admin Panel

## Overview
Add a revenue summary section at the top of the Admin Dashboard showing earnings for today, this week, and this month, based on completed orders.

## Changes

### `src/pages/AdminDashboard.tsx`
- Add a revenue stats bar above the Tabs component
- Calculate revenue from orders with status "done" using `useMemo`:
  - **Today**: sum of orders created today
  - **This week**: sum of orders from the last 7 days
  - **This month**: sum of orders from the current calendar month
- Display as three card-style blocks with labels and formatted amounts (e.g., "12 500 ₽")
- Include order count for each period

## Technical details
- Revenue computed client-side from already-fetched `orders` data (no new queries needed)
- Uses `date-fns` for date comparisons (`isToday`, `isThisWeek`, `isThisMonth`)
- Cards use existing `bg-card border rounded-2xl` styling to match the design
- Only counts orders with status `done` for accurate revenue tracking

