# Mukiria Eats

Production-Ready UI/UX Development Prompt – Phase 1

Project Title

Mukiria Technical Training Institute Cafeteria Ordering System

Objective

Design and develop a fully responsive, modern, production-quality UI/UX for a web-based cafeteria ordering system. This phase focuses only on the frontend (UI/UX). No backend logic, payment integration, or database functionality should be implemented yet. Any dynamic data should be represented with realistic mock data.

The design should feel comparable to modern food ordering applications such as Uber Eats or Glovo while maintaining Mukiria Technical Training Institute's branding and simplicity.

Technology Stack

Use:

React 19

Vite

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion (animations)

Lucide React Icons

React Router

React Hook Form

Zod

Recharts (analytics charts)

Sonner (toast notifications)

The project should follow a clean, scalable folder structure suitable for production.

Design Theme

Style

Modern

Minimal

Elegant

Mobile-first

Responsive

Professional

Color Palette

Primary
Deep Green (#166534)

Secondary
White (#FFFFFF)

Background
#F8FAFC

Cards
White

Accent
Amber (#F59E0B)

Danger
Red

Success
Green

Border Radius

16px–20px

Shadows

Soft floating shadows

Typography

Modern sans-serif

Clear hierarchy

Large headings

Comfortable spacing

Animations

The entire application should feel alive through subtle animations.

Use Framer Motion.

Include:

Fade animations

Slide animations

Scale animations

Hover animations

Ripple button effects

Floating cards

Staggered loading

Count-up animations

Smooth page transitions

Skeleton loading screens

Animations should be smooth (200–400ms) and never block usability.

Student Portal

The student portal must not require login.

Students access it by scanning a QR Code.

Landing Experience

After opening the QR code,

show a beautiful splash screen.

Display:

Mukiria Technical Training Institute

Cafeteria

Fresh Meals Served Daily

Loading animation

Automatically transition into the menu.

Hero Section

Display:

Welcome to Mukiria Technical Cafeteria

Fresh Meals • Fast Service

Opening Hours

Today's Special (placeholder)

Beautiful background image

Search bar

Categories

Display categories as horizontally scrollable chips.

Examples:

All

Main Meals

Proteins

Vegetables

Drinks

Snacks

Desserts

Selecting a category should animate the meal cards.

Meal Cards

Do NOT display meals in a list.

Display beautiful cards.

Each card contains:

Large meal image

Meal name

Short description

Price

Category badge

Rating (UI only)

Availability badge

Add button

Favorite icon (UI only)

Cards should have:

Rounded corners

Soft shadows

Hover lift animation

Image zoom on hover

Tap animation on mobile

Cards should load one by one using staggered animations.

Search

Provide instant search.

Results should animate smoothly.

Floating Shopping Cart

A floating shopping cart should remain visible.

Display:

Number of selected items

Running total

The cart icon should bounce slightly whenever a meal is added.

Cart Drawer

The shopping cart opens as a right-side drawer.

Display:

Selected meals

Quantity controls

Remove item

Subtotal

Total

Proceed to Payment button

Updating totals should animate smoothly.

Payment Screen

Display a beautiful payment card.

Fields:

Phone Number

Total Amount

Pay Button

The Pay button should animate through these states:

Pay Now

↓

Processing...

↓

Payment Successful

Payment Success Popup

DO NOT redirect to another page.

Instead:

Blur the current page.

Display a centered premium modal.

The modal should include:

Animated success icon

Mukiria Technical logo placeholder

Payment Successful title

Large Ticket Number

Amount Paid

Collection instructions

Buttons:

Copy Ticket Number

Done

Display a reminder encouraging students to save or screenshot the ticket.

The popup should appear using fade + scale animations.

Background should use:

Dark overlay

Blur effect

Interaction disabled until popup closes.

Success Banner

After closing the popup,

display a small success banner at the top.

Example:

Payment Successful

Ticket Number

View Ticket

Empty States

Provide elegant empty states.

Examples:

No meals available.

No search results.

Cart is empty.

Use illustrations or icons.

Loading States

Use skeleton loaders.

Never display plain "Loading..."

Toast Notifications

Animated toast notifications.

Examples:

Meal added

Meal removed

Payment successful

Ticket copied

Admin Portal

The admin portal uses a fixed left sidebar.

Sidebar

Include:

Dashboard

Orders

Meals

Analytics

Reports

Settings

Logout

Highlight the active page.

Collapse automatically on mobile.

Dashboard

Beautiful summary cards.

Display:

Today's Revenue

Today's Orders

Pending Orders

Collected Orders

Meals Sold

Cards should animate on load.

Recent Orders

Display recent paid orders.

Orders should slide into the list.

Include notification sound placeholder.

Orders Page

This page displays only:

Pending Orders

Include:

Search by Ticket Number

Recent Orders

Order Details Drawer

Verify Collection button

Collected orders should disappear from Pending automatically (UI simulation).

Provide realistic mock data.

Meals Page

This page manages ONLY individual meals.

Do NOT create meal combinations.

Include:

Add Meal

Edit Meal

Delete Meal

Search Meal

Meal Table

Each meal contains:

Image

Name

Description

Category

Price

Availability Status

Actions

Add/Edit Meal Dialog

Fields:

Meal Image Upload

Meal Name

Description

Category

Price

Availability

Save

Cancel

Beautiful modal design.

Availability Toggle

Every meal has:

Available

Unavailable

If marked Unavailable,

the meal should disappear from the student portal (UI simulation using mock state).

The toggle should animate smoothly.

Analytics Page

Design a modern analytics dashboard.

Include:

Summary Cards

Revenue Trend

Orders Trend

Most Ordered Meals

Meal Combination Analysis

Sales by Category

Peak Ordering Hours

Recent Performance

Charts should animate on load.

Use mock data.

Provide filters:

Today

Week

Month

Year

Custom Range

Reports

Beautiful report cards.

Daily

Weekly

Monthly

Meal Performance

Payment Reports

Include Download buttons.

Settings

Design only.

Include:

Institution Details

Operating Hours

QR Code Preview

Admin Profile

Theme Preference

Notification Settings

M-Pesa Configuration (placeholder)

Responsiveness

The application must be fully responsive.

Desktop

Tablet

Mobile

Sidebar collapses on mobile.

Cards rearrange automatically.

Buttons remain touch-friendly.

Accessibility

Provide:

Keyboard navigation

Focus states

Proper contrast

ARIA labels where appropriate

Large tap targets

UI Quality Requirements

The interface should feel premium.

Use:

Consistent spacing

Consistent shadows

Smooth transitions

Professional icons

High-quality placeholders

Rounded cards

Modern dashboard layout

No clutter

No outdated components

Every page should look production-ready.

Mock Data

Populate the interface with realistic sample data for:

Meals

Orders

Analytics

Reports

Ticket Numbers

Phone Numbers

Revenue

Meal Images

Deliverables

Build a complete frontend containing:

Student Portal

Admin Portal

Responsive layouts

Production-quality reusable components

Modern animations

Mock data

Clean folder structure

Theme support (Light/Dark)

Professional UI ready for backend integration in Phase 2

The final result should look and feel like a commercial cafeteria ordering platform rather than a school project. Prioritize exceptional user experience, polished animations, responsive design, and maintainable component architecture so the frontend can transition seamlessly into full-stack development in the next phase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://grub-harmony-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5fdb0bc9-c9d0-4dc4-9675-4bd64c54282e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
