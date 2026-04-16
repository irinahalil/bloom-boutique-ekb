

# Plan: Admin Panel Improvements + Delivery Date/Time in Cart

## What already works
- Admin panel has Orders tab (with status management) and Products tab (CRUD with image upload)
- Cart has checkout form (name, phone, address, comment)

## What needs to change

### 1. Database migration — add delivery date/time to orders
Add two nullable columns to `orders` table:
- `delivery_date` (date, nullable)
- `delivery_time` (text, nullable) — stores a time slot like "10:00–12:00"

### 2. Cart page — add date and time picker
- Add a date picker (Shadcn Calendar in Popover) for choosing delivery date (minimum = tomorrow)
- Add a time slot selector (Select component) with predefined slots: "09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"
- Save `delivery_date` and `delivery_time` into the order on submit

### 3. Admin panel — orders improvements
- Show delivery date and time in each order card
- Add order filtering/sorting (by status, by date)
- Improve the order card layout for clarity

### 4. Admin panel — products management polish
- Already has: create, edit, delete, image upload from file, URL fallback, category, color, in_stock toggle
- This is already fully functional — no major changes needed since all CRUD operations and image upload from computer are working

## Technical details

**Migration SQL:**
```sql
ALTER TABLE public.orders
  ADD COLUMN delivery_date date,
  ADD COLUMN delivery_time text;
```

**Files to edit:**
- `src/pages/Cart.tsx` — add date picker + time slot selector to form, include in submit payload
- `src/pages/AdminDashboard.tsx` — display delivery_date/time in order cards
- New migration file for the two columns

**Dependencies:** `date-fns` (already available via calendar component)

