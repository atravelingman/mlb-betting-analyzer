# MLB Betting Analyzer Style Guide

## Colors
- Primary: #1a237e (Deep Blue)
- Secondary: #c62828 (Deep Red)
- Background: #f5f5f5 (Light Gray)
- Card Background: #ffffff (White)
- Success: #4caf50 (Green)
- Warning: #ffc107 (Yellow)
- Danger: #f44336 (Red)
- Info: #2196f3 (Blue)

## Typography
- Primary Font: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- Font Sizes:
  - Headings: 1.5rem (24px)
  - Subheadings: 1.25rem (20px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

## Components

### Cards
- Border Radius: 10px
- Box Shadow: 0 2px 4px rgba(0,0,0,0.1)
- Padding: 15px
- Margin Bottom: 20px

### Buttons
- Border Radius: 8px
- Padding: 10px 20px
- No Border
- Hover Effect: Slight color change

### Form Elements
- Border Radius: 8px
- Border: 1px solid #ddd
- Padding: 10px
- Focus State: Primary color border

### Tables
- Font Size: 0.9rem
- Header Background: #f8f9fa
- Responsive with horizontal scroll
- Compact padding for better data display

### Status Indicators
- Green: #4caf50 (Active/Available)
- Yellow: #ffc107 (Day-to-Day)
- Orange: #ff9800 (10-Day IL)
- Red: #f44336 (60-Day IL)

### Icons
- Font Awesome 6.0.0
- Standard size: 1rem
- Header icons: 1.25rem
- Button icons: 1rem with margin-right: 0.5rem

## Layout

### Grid System
- Bootstrap 5 grid
- Breakpoints:
  - xs: <576px
  - sm: ≥576px
  - md: ≥768px
  - lg: ≥992px
  - xl: ≥1200px
  - xxl: ≥1400px

### Spacing
- Section Margin: 1.5rem (24px)
- Card Padding: 1rem (16px)
- Form Group Margin: 1rem (16px)
- Button Group Margin: 1.5rem (24px)

### Animations
- Transitions: 0.2s ease-in-out
- Loading Spinner: Bootstrap spinner
- Fade effects for alerts and notifications

## Responsive Design
- Mobile-first approach
- Stack columns on small screens
- Responsive tables with horizontal scroll
- Adjust font sizes and spacing for mobile

## Accessibility
- ARIA labels for interactive elements
- Color contrast ratios following WCAG 2.1
- Focus indicators for keyboard navigation
- Screen reader friendly markup

## Best Practices
1. Use semantic HTML elements
2. Maintain consistent spacing
3. Implement responsive images
4. Follow BEM naming convention for CSS
5. Keep JavaScript modular and documented
6. Use CSS variables for theme colors
7. Implement error handling and loading states
8. Ensure cross-browser compatibility 