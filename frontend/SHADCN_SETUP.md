# shadcn/ui Setup Guide

This branch (`feature/dev-001/testing-shadcn-ui`) contains a test setup of shadcn/ui components.

## What's Been Set Up

✅ **Dependencies Installed:**
- `class-variance-authority` - For component variants
- `tailwind-merge` - For merging Tailwind classes
- `lucide-react` - Icon library (for shadcn/ui components)
- `tailwindcss-animate` - Animation utilities
- `@radix-ui/react-slot` - Radix UI primitives

✅ **Configuration Files:**
- `components.json` - shadcn/ui configuration
- `src/lib/utils.ts` - `cn()` utility function for class merging
- Updated `tailwind.config.js` - Added shadcn/ui theme variables
- Updated `src/index.css` - Added CSS variables for theming

✅ **Components Installed:**
- `Button` - Multiple variants (default, secondary, destructive, outline, ghost, link)
- `Input` - Form input component
- `Card` - Card component with header, content, footer

## Demo Component

A demo component has been created at `src/components/ShadcnDemo.tsx` showcasing:
- All button variants
- Input examples
- Card usage
- Component integration examples

### To View the Demo

You can import and use the demo component in any page:

```tsx
import { ShadcnDemo } from "@/components/ShadcnDemo";

// In your component
<ShadcnDemo />
```

## Adding More Components

To add more shadcn/ui components, use:

```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
```

## Using Components

### Button Example
```tsx
import { Button } from "@/components/ui/button";

<Button>Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
```

### Input Example
```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Enter text..." />
<Input type="email" placeholder="email@example.com" />
```

### Card Example
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

## Customization

All components are fully customizable:
1. Components are copied to your `src/components/ui/` directory
2. You can modify them directly
3. They use Tailwind CSS classes, so you can easily customize styles
4. CSS variables in `src/index.css` control the theme colors

## Theme Customization

Edit CSS variables in `src/index.css` to customize colors:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```

## Comparison with Existing Components

Your existing custom components (like `CustomDropdown.tsx`) can coexist with shadcn/ui components. You can:
- Gradually migrate to shadcn/ui components
- Use shadcn/ui for new features
- Mix and match as needed

## Next Steps

1. Test the demo component in your app
2. Try replacing some existing components with shadcn/ui equivalents
3. Evaluate developer experience and consistency
4. Decide whether to adopt shadcn/ui or stick with custom components

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Component Examples](https://ui.shadcn.com/examples)
- [Component Directory](https://ui.shadcn.com/docs/components)

