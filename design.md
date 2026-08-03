# Pepoltek HRM Frontend — Design System

> **Purpose**: This document is the single source of truth for the design language of the Pepoltek HRM frontend. Any agent or developer working on this project MUST follow these patterns.

---

## 1. Tech Stack & Theming

| Layer | Technology |
|---|---|
| Styling | **Tailwind CSS v4** via `@import "tailwindcss"` |
| Components | **Radix UI** primitives + **class-variance-authority (cva)** |
| Icons | **`@iconify/react`** (Heroicons: `heroicons:*`) + **Lucide** (`lucide-react`) for inline icons |
| Dark Mode | Class-based: `.dark` applied on `<html>` |
| Utility | `cn()` from `@/lib/utils` — merges `tailwind-merge` + `clsx` |
| Toast | `react-hot-toast` |

### CSS Files
- `src/app/globals.css` — minimal, just imports Tailwind
- `src/app/(dashboard)/dashboard.css` — **main design system** with all CSS variables and themes
- `src/app/(auth)/auth.css` — same tokens as dashboard.css, applied to auth pages

---

## 2. Color System

### Default Theme (Violet/Indigo — Light Mode)

All colors are CSS variables, consumed via Tailwind utilities (`bg-primary`, `text-default-700`, etc.).

#### Core Semantic Tokens

| Token | Light Mode Value | Usage |
|---|---|---|
| `--background` | `hsl(0 0% 100%)` | Page/body background |
| `--foreground` | `hsl(222.2 84% 4.9%)` | Body text |
| `--card` | `hsl(0 0% 100%)` | Card surfaces |
| `--card-foreground` | `hsl(222.2 84% 4.9%)` | Card text |
| `--border` | `hsl(214.3 31.8% 91.4%)` | Borders, dividers |
| `--input` | `hsl(214.3 31.8% 91.4%)` | Input borders |
| `--ring` | `hsl(262.1 83.3% 57.8%)` | Focus rings |
| `--muted` | `hsl(220 14.3% 95.9%)` | Muted backgrounds |
| `--muted-foreground` | `hsl(215.4 16.3% 46.9%)` | Subdued/helper text |
| `--popover` | `hsl(0 0% 100%)` | Dropdown/popover bg |
| `--radius` | `0.5rem` | Base border radius |

#### Brand Color — Primary (Violet)

| Step | Value | Usage |
|---|---|---|
| `--primary` | `hsl(250 92% 70%)` | Buttons, links, active states |
| `--primary-foreground` | `hsl(240 100% 98%)` | Text on primary bg |
| `--primary-50` to `--primary-950` | Full violet scale | Tints, hover states, badges |

#### Status Colors

| Token | Value | Usage |
|---|---|---|
| `--success` | `hsl(142.1 70.6% 45.3%)` | Verified, active, positive |
| `--success-foreground` | `hsl(138.5 76.5% 96.7%)` | Text on success bg |
| `--destructive` | `hsl(0 84.2% 60.2%)` | Delete, error, danger |
| `--destructive-foreground` | near-white | Text on destructive bg |
| `--warning` | `hsl(24.6 95% 53.1%)` | Pending, caution |
| `--warning-foreground` | `hsl(33.3 100% 96.5%)` | Text on warning bg |
| `--info` | `hsl(188.7 94.5% 42.7%)` | Informational states |
| `--info-foreground` | `hsl(183.2 100% 96.3%)` | Text on info bg |

#### Default Scale (Gray Neutrals)

Used extensively for text hierarchy, backgrounds, and borders.

| Step | Description |
|---|---|
| `default-50` | Nearly white — subtle backgrounds |
| `default-100` | Light backgrounds, hover fills |
| `default-200` | Borders, dividers |
| `default-300` | Disabled/muted borders |
| `default-400` | Placeholder, icon fills |
| `default-500` | Secondary/subdued text |
| `default-600` | Meta text, labels |
| `default-700` | Label text, medium emphasis |
| `default-800` | Table headers, form labels |
| `default-900` | Section titles, strong text |
| `default-950` | Near-black, primary foreground |

### Dark Mode Overrides

Dark mode inverts the `default-*` scale (950 becomes lightest, 50 becomes darkest) and uses:
- `--background`: `hsl(222.2 47.4% 11.2%)`
- `--card`: `hsl(215 27.9% 16.9%)`
- `--primary`: `hsl(254 86% 58%)` (slightly darker violet)

### Available Color Themes (CSS Classes on `<html>`)

Apply via className on `<html>` alongside `.dark`:

| Class | Theme |
|---|---|
| *(default)* | Violet/Indigo |
| `.theme-zinc` | Neutral Zinc |
| `.theme-slate` | Cool Slate |
| `.theme-stone` | Warm Stone |
| `.theme-gray` | Gray |
| `.theme-neutral` | Pure Neutral |
| `.theme-red` | Red |

---

## 3. Typography

The project inherits Tailwind's default `font-sans` (system UI) unless overridden by Radix.

### Text Size Reference

| Class | Usage |
|---|---|
| `text-[10px]` | Tiny pill labels (status badges, verified) |
| `text-xs` | Small captions, monospace codes, footnotes (`0.75rem`) |
| `text-sm` | Body text, table cells, form labels, descriptions (`0.875rem`) |
| `text-base` | Paragraph text, select options (`1rem`) |
| `text-lg` | Modal titles, section headings (`1.125rem`) |
| `text-xl` | Card titles (`1.25rem`) |
| `text-2xl`+ | Page-level headings |

### Font Weight Reference

| Class | Usage |
|---|---|
| `font-normal` | Table cell data |
| `font-medium` | General labels, nav items |
| `font-semibold` | Section headers, button text, column headers |
| `font-bold` | Section titles, counts, modal titles |

### Text Color Hierarchy

| Class | Usage |
|---|---|
| `text-default-900` | Primary content, titles |
| `text-default-800` | Table headers |
| `text-default-700` | Labels, form field headings |
| `text-default-600` | Table cell data |
| `text-default-500` | Secondary, subdued content |
| `text-default-400` | Placeholders, icons, hints |
| `text-primary` | Links, active tabs, highlights |
| `text-success` | Verified states |
| `text-warning` | Pending states |
| `text-destructive` | Errors, delete actions |

---

## 4. Spacing & Borders

### Border Radius

| Class | Value | Usage |
|---|---|---|
| `rounded-sm` | 2px | Tiny elements |
| `rounded-md` | `--radius` = 0.5rem | Buttons (default), table rows |
| `rounded-lg` | `--radius` = 0.5rem | Cards, standard modals |
| `rounded-xl` | 0.75rem | Form fields, color pickers |
| `rounded-2xl` | 1rem | Drag-and-drop zones |
| `rounded-full` | 9999px | Avatars, icon circles, badges |

### Standard Padding

| Context | Classes |
|---|---|
| Card body | `p-6` |
| Card header | `px-4 py-4` |
| Table cell | `p-4` |
| Table header | `h-14 px-4` |
| Modal sections | `p-6` |
| Button (default) | `px-4 py-[10px]` |
| Button (lg) | `px-[18px] py-[10px]` |

### Shadow Reference

```
--shadow-base:   0px 0px 1px rgba(40,41,61,0.08),  0px 0.5px 2px rgba(96,97,112,0.16)
--shadow-base2:  0px 2px 4px rgba(40,41,61,0.04),  0px 8px 16px rgba(96,97,112,0.16)
--shadow-base3:  16px 10px 40px rgba(15,23,42,0.22)
--shadow-dropdown: 0px 4px 8px rgba(0,0,0,0.08)
shadow-2xl (modals/dialogs)
```

---

## 5. Button Component

**Import:** `@/components/ui/button`

### Base Class (always applied)
```
inline-flex items-center justify-center rounded-md text-sm font-semibold
ring-offset-background transition-colors
disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap
```

### Color Prop

| `color` | Appearance |
|---|---|
| `default` / `primary` | Violet bg, light foreground — **main CTA** |
| `destructive` | Red bg — delete/remove actions |
| `success` | Green bg — confirm/approve |
| `warning` | Orange bg — caution actions |
| `info` | Cyan bg — informational actions |
| `secondary` | Light gray bg, muted text |

### Variant Prop (modifies fill behavior)

| `variant` | Appearance |
|---|---|
| *(none)* | Solid filled button |
| `outline` | Transparent bg, colored border + text, fills on hover |
| `soft` | Translucent tinted bg (`/10` opacity), no border |
| `ghost` | No bg or border, text only — fills on hover |

### Size Prop

| `size` | Height | Use case |
|---|---|---|
| `xs` | `h-9` | Compact inline |
| `sm` | `h-9` | Small actions |
| `md` | `h-9` | Medium actions |
| `default` | `h-10` | Standard CTA |
| `lg` | `h-11` | Modal footer buttons |
| `xl` | `h-12` | Hero CTAs |
| `icon` | `h-10 w-10` | Icon-only buttons |

### Common Usage Patterns

```jsx
// Primary CTA
<Button>Save Changes</Button>

// Destructive action
<Button color="destructive">Delete</Button>

// Safe cancel / secondary
<Button variant="outline">Cancel</Button>

// Export / outline action
<Button variant="outline" type="button">Export Logs</Button>

// Small icon action
<Button size="icon" color="secondary" className="h-6 w-6 rounded-full">
  <Icon icon="heroicons:ellipsis-horizontal" />
</Button>

// Inline soft badge-like button
<Button variant="soft" color="info" size="xs">View</Button>
```

---

## 6. Input Component

**Import:** `@/components/ui/input`

### Default Config
- Height: `h-9` / `text-sm`
- Variant: `bordered` (shows border)
- Radius: `rounded-lg`
- Color: `default` (slate border, primary on focus)

### Variant Options

| `variant` | Style |
|---|---|
| `bordered` | Standard border |
| `flat` | `bg-default-100`, no border |
| `underline` | Bottom border only |
| `faded` | Border + subtle bg |
| `ghost` | No border until focused |
| `flat-underline` | Flat bg + bottom border |

### Size Options

| `size` | Height |
|---|---|
| `sm` | `h-8 text-xs` |
| `md` | `h-9 text-xs` (default) |
| `lg` | `h-10 text-sm` |
| `xl` | `h-12 text-base` |

### Radius Options: `none`, `sm`, `md`, `lg`, `xl`

### Color Options: `default`, `primary`, `info`, `warning`, `success`, `destructive`

### Placeholder text
- Default: `placeholder:text-accent-foreground/50` (50% opacity, subdued)

```jsx
// Standard form input
<Input placeholder="Enter domain (e.g., hr.acme.com)" />

// Monospace hex color input
<Input {...register("primary_color")} type="text" placeholder="#6366F1" className="font-mono" />

// Error state
<Input className="border-destructive" />
```

---

## 7. Label Component

**Import:** `@/components/ui/label`

```jsx
// Form label
<Label htmlFor="timezone" className="font-semibold text-default-700 flex items-center gap-2">
  <Globe className="w-4 h-4 text-primary" />
  System Timezone
</Label>
```

- Always pair with form inputs via `htmlFor`
- Pattern: `font-semibold text-default-700` with an optional icon prefixed in `text-primary`

---

## 8. Card Component

**Import:** `@/components/ui/card`

### Anatomy

```jsx
<Card>                          // rounded-md bg-card shadow-sm
  <CardHeader>                  // px-4 py-4 mb-6 border-b border-border
    <CardTitle />               // text-xl font-medium
    <CardDescription />         // text-sm text-muted-foreground mt-2
  </CardHeader>
  <CardContent>                 // p-6 pt-0
    ...
  </CardContent>
  <CardFooter>                  // flex items-center p-6 pt-0
    ...
  </CardFooter>
</Card>
```

### Common Patterns

```jsx
// Standard content card
<Card>
  <CardContent className="space-y-8">
    ...
  </CardContent>
</Card>

// Card with p-0 for custom header sections (modal-style)
<Card className="p-0 overflow-hidden">
  <div className="bg-primary/5 p-6 border-b border-primary/10">
    ...
  </div>
  <CardContent className="p-6">
    ...
  </CardContent>
</Card>

// Tab-connected card (no top-left radius)
<Card className="rounded-t-none pt-6">
  <CardContent>...</CardContent>
</Card>
```

---

## 9. Badge Component

**Import:** `@/components/ui/badge`

### Base Classes
```
inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors
```

### Color + Variant combos

| Usage | Props |
|---|---|
| Active/verified status | `<Badge color="success">` |
| Pending/unverified | `<Badge color="warning">` |
| Error/danger | `<Badge color="destructive">` |
| Info label | `<Badge color="info">` |
| Role pill | `<Badge color="secondary">` |
| Soft/tinted | `variant="soft"` |
| Outline only | `variant="outline"` |

### Inline status patterns (used in tables without `<Badge>`)

```jsx
// Verified
<span className="text-success text-xs font-bold flex items-center gap-1">
  <Icon icon="heroicons:check-badge" className="w-4 h-4" />
  VERIFIED
</span>

// Pending
<span className="text-warning text-xs font-bold flex items-center gap-1">
  <Icon icon="heroicons:clock" className="w-4 h-4" />
  PENDING
</span>

// Active status pill
<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success/10 text-success">
  active
</span>

// Role chip
<span className="capitalize px-2 py-0.5 rounded bg-default-100 text-default-700 text-xs font-medium">
  hr manager
</span>
```

---

## 10. Dialog (Modal) Component

**Import:** `@/components/ui/dialog`

### Sizes

| `size` | Max Width |
|---|---|
| `xs` | 332px |
| `sm` | 384px |
| `md` | 444px (default) |
| `lg` | 536px |
| `xl` | 628px |
| `2xl–5xl` | 720px – 996px |
| `full` | Full screen |

### Premium Modal Pattern (used in the app)

```jsx
<Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
  <DialogContent size="sm" className="p-0 overflow-hidden border-none shadow-2xl">
    {/* Colored header section */}
    <div className="bg-primary/5 p-6 border-b border-primary/10">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon icon="heroicons:user-circle" className="w-6 h-6 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-default-900">
              Update Member Role
            </DialogTitle>
            <p className="text-sm text-default-500 mt-1">
              Change permissions for {member?.full_name}
            </p>
          </div>
        </div>
      </DialogHeader>
    </div>

    {/* Body */}
    <div className="p-6 space-y-5">
      ...
      <DialogFooter className="gap-3">
        <Button variant="outline" onClick={...} className="flex-1 sm:flex-none">Cancel</Button>
        <Button onClick={...} className="flex-1 sm:min-w-[140px]">
          <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
          Confirm
        </Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

### Destructive AlertDialog Pattern

```jsx
<AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
  <AlertDialogContent className="p-0 overflow-hidden border-none shadow-2xl max-w-md">
    {/* Red-tinted header */}
    <div className="bg-destructive/5 p-6 border-b border-destructive/10">
      <AlertDialogHeader className="flex-row items-center gap-4 space-y-0">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
          <Icon icon="heroicons:trash" className="w-6 h-6 text-destructive" />
        </div>
        <div className="text-left">
          <AlertDialogTitle className="text-xl font-bold text-default-900">
            Remove Team Member
          </AlertDialogTitle>
          <p className="text-sm text-default-500 mt-1">This action is permanent.</p>
        </div>
      </AlertDialogHeader>
    </div>

    <div className="p-6">
      <AlertDialogDescription className="text-default-700 text-base leading-relaxed">
        Are you sure you want to remove <span className="font-bold text-default-900">
          "{memberToRemove?.full_name}"
        </span>?
      </AlertDialogDescription>

      <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
        <AlertDialogCancel className="h-11 px-6 font-medium">Keep Member</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => { e.preventDefault(); handleRemove(); }}
          className="h-11 px-6 font-semibold bg-destructive hover:bg-destructive/90 text-white"
        >
          <Icon icon="heroicons:trash" className="w-4 h-4 mr-2" />
          Confirm Removal
        </AlertDialogAction>
      </div>
    </div>
  </AlertDialogContent>
</AlertDialog>
```

---

## 11. Table Component

**Import:** `@/components/ui/table`

### Anatomy

| Part | Default Classes |
|---|---|
| `Table` | `w-full text-sm` (wrapped in `overflow-x-auto`) |
| `TableHeader` | `[&_tr]:border-b` |
| `TableHead` | `h-14 px-4 text-left font-semibold text-sm text-default-800 capitalize` |
| `TableRow` | `border-b border-default-300 transition-colors` |
| `TableCell` | `p-4 text-sm text-default-600 font-normal` |

### Standard Table Pattern

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      ...
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id} className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        ...
      </TableRow>
    ))}
    {data.length === 0 && (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center text-default-500">
          No records found.
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
```

### Loading State during mutations
```jsx
<TableRow className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
```

---

## 12. Tabs Component

**Import:** `@/components/ui/tabs`

### Custom Tab Style (used in Profile pages)

The base `TabsList` and `TabsTrigger` are heavily overridden in profile pages using the `TAB_TRIGGER_CLS` constant pattern:

```js
const TAB_TRIGGER_CLS =
  "capitalize px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent " +
  "data-[state=active]:text-primary transition duration-150 " +
  "before:transition-all before:duration-150 relative " +
  "before:absolute before:left-1/2 before:-bottom-[11px] before:h-[2px] " +
  "before:-translate-x-1/2 before:w-0 " +
  "data-[state=active]:before:bg-primary data-[state=active]:before:w-full " +
  "whitespace-nowrap";
```

### Tab Header Pattern

```jsx
<TabsList className="bg-card flex-1 w-full px-5 pt-6 pb-2.5 h-fit border-b border-border rounded-none justify-start gap-4 md:gap-12 rounded-t-md">
  <TabsTrigger value="details" className={TAB_TRIGGER_CLS}>Overview</TabsTrigger>
  <TabsTrigger value="update" className={TAB_TRIGGER_CLS}>Update Information</TabsTrigger>
  <TabsTrigger value="domain" className={TAB_TRIGGER_CLS}>Domain Settings</TabsTrigger>
</TabsList>
```

The tab-connected card uses `rounded-t-none`:
```jsx
<TabsContent value="details" className="mt-0">
  <Card className="rounded-t-none pt-6">
    <CardContent>...</CardContent>
  </Card>
</TabsContent>
```

### URL-Synced Tabs Pattern

```jsx
const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();
const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "details");

useEffect(() => {
  setActiveTab(searchParams.get("tab") || "details");
}, [searchParams]);

const handleTabChange = (val) => {
  setActiveTab(val);
  router.push(`${pathname}?tab=${val}`, { scroll: false });
};
```

---

## 13. Icon System

### Primary: `@iconify/react`

```jsx
import { Icon } from "@iconify/react";

// Usage for Heroicons
<Icon icon="heroicons:check" className="w-5 h-5 text-primary-foreground" />
<Icon icon="heroicons:trash" className="w-6 h-6 text-destructive" />
<Icon icon="heroicons:user-circle" className="w-6 h-6 text-primary" />
<Icon icon="heroicons:building-office" className="text-4xl text-default-400" />
```

### Secondary: `lucide-react` (for structural UI icons)

```jsx
import { Loader2, Upload, X, Palette, Globe, ImageIcon, Loader2 } from "lucide-react";

// Loading spinner (always animate-spin)
<Loader2 className="w-4 h-4 mr-2 animate-spin" />

// Form icons
<Upload className="w-7 h-7" />
<X className="w-3.5 h-3.5" />
<Palette className="w-4 h-4 text-primary" />
<Globe className="w-4 h-4 text-primary" />
```

### Icon Size Conventions

| Context | Size Class |
|---|---|
| Inline label icon | `w-4 h-4` |
| Button icon | `w-5 h-5` |
| Modal/dialog header | `w-6 h-6` |
| Avatar/placeholder | `text-4xl` |
| Section icon (large) | `w-7 h-7` or `w-8 h-8` |

---

## 14. Form Patterns

### Standard Form Section

```jsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="field" className="font-semibold text-default-700 flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      Field Label
    </Label>
    <Input id="field" placeholder="..." {...register("field")} />
    {errors.field && (
      <p className="text-destructive text-xs italic">{errors.field.message}</p>
    )}
  </div>

  <div className="flex justify-end pt-4">
    <Button type="submit" disabled={isPending}>
      {isPending
        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        : <Icon icon="heroicons:check" className="w-5 h-5 text-primary-foreground me-1" />
      }
      Save Changes
    </Button>
  </div>
</form>
```

### Validation

- Library: `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- Error display: `text-destructive text-xs italic` under each field

### Drag-and-Drop Upload Zone

```jsx
<div
  onDragOver={onDragOver}
  onDragLeave={onDragLeave}
  onDrop={onDrop}
  onClick={() => !preview && fileInputRef.current?.click()}
  className={cn(
    "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
    isDragging
      ? "border-primary bg-primary/5 scale-[1.01]"
      : "border-default-200 hover:border-primary/50 hover:bg-default-50",
    preview ? "h-40 cursor-default" : "h-32"
  )}
>
  {/* empty state */}
  <div className="h-full flex flex-col items-center justify-center gap-2 text-default-400 group-hover:text-default-600 transition-colors">
    <Upload className="w-7 h-7" />
    <p className="text-sm font-medium">Drop here, or <span className="font-semibold underline">browse</span></p>
  </div>
</div>
```

### Color Picker Pattern

```jsx
// Preset color swatches
<div className="flex flex-wrap gap-2.5">
  {PRESET_COLORS.map((color) => (
    <button
      key={color}
      type="button"
      onClick={() => setValue("primary_color", color, { shouldValidate: true })}
      className={cn(
        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
        primaryColor === color
          ? "border-default-900 scale-110 shadow-md"
          : "border-transparent"
      )}
      style={{ background: color }}
    />
  ))}
</div>

// Hex input + color preview + native picker
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-xl border border-default-200 shadow-inner" style={{ background: primaryColor }} />
  <Input {...register("primary_color")} type="text" className="font-mono flex-1" placeholder="#6366F1" />
  <input type="color" value={primaryColor}
    onChange={(e) => setValue("primary_color", e.target.value, { shouldValidate: true })}
    className="w-10 h-10 rounded-xl cursor-pointer border border-default-200 p-0.5 bg-transparent"
  />
</div>
```

---

## 15. Layout Patterns

### Dashboard Content Grid

```jsx
// Standard 2-column profile/detail layout
<div className="grid grid-cols-12 gap-6 mt-6">
  <div className="col-span-12 lg:col-span-4 space-y-6">
    {/* Left sidebar: avatar, meta card */}
  </div>
  <div className="col-span-12 lg:col-span-8">
    {/* Right: Tabs with content */}
  </div>
</div>
```

### Section Heading Pattern

```jsx
<h4 className="text-sm font-semibold text-default-800 mb-3 uppercase tracking-wider flex items-center gap-2">
  <Icon icon="heroicons:information-circle" className="w-4 h-4 text-primary" />
  Section Title
</h4>
```

### Key-Value Row Pattern (Overview tabs)

```jsx
<div className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
  <span className="text-default-500 font-medium">Label</span>
  <span className="text-default-800 font-semibold">Value</span>
</div>
```

### Informational Alert / Banner

```jsx
// Neutral info (not configured)
<div className="mb-6 p-4 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium">
  You haven't configured a custom domain yet.
</div>

// Warning / amber
<div className="mb-6 p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-sm font-medium">
  You have not have any brand configuration.
</div>

// DNS / code block info
<div className="mt-8 p-6 bg-default-50 border border-border rounded-lg">
  <h4 className="text-sm font-semibold mb-2">DNS Verification Required</h4>
  <p className="text-xs text-default-500 mb-4">...</p>
  <div className="space-y-3 text-sm">
    <div className="flex justify-between p-3 bg-card border border-border rounded">
      <span className="font-medium text-default-600">Record Type</span>
      <span className="font-mono">TXT</span>
    </div>
  </div>
</div>
```

---

## 16. Action Menu / Dropdown Pattern

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="icon" color="secondary"
      className="h-6 rounded-full bg-transparent w-6 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground focus-visible:ring-0">
      <Icon icon="heroicons:ellipsis-horizontal" className="h-6 w-6" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" avoidCollisions>
    <DropdownMenuLabel>Action Center</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="cursor-pointer" onClick={handleEdit}>
      <Icon icon="heroicons:pencil" className="h-4 w-4 mr-2" />
      Edit Member
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleRemove}>
      <Icon icon="heroicons:trash" className="h-4 w-4 mr-2" />
      Remove
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 17. Toast Notifications

**Library:** `react-hot-toast`

```jsx
import toast from "react-hot-toast";

toast.success("Role updated successfully.");
toast.error(result.message || "Failed to update role.");
toast.error("Something went wrong. Please try again.");
```

---

## 18. Loading & Pending States

### Transition Pattern

```jsx
const [isPending, startTransition] = useTransition();

const handleAction = () => {
  startTransition(async () => {
    const result = await someServerAction();
    if (result.success) { toast.success(...); }
    else { toast.error(...); }
  });
};
```

### Button Spinner (always inside button)

```jsx
<Button type="submit" disabled={isPending}>
  {isPending
    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    : <Icon icon="heroicons:check" className="w-5 h-5 text-primary-foreground me-1" />
  }
  Save Changes
</Button>
```

### Table row opacity during mutation

```jsx
<TableRow className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
```

---

## 19. Server Actions Pattern

All server actions in `src/actions/` follow this format:

```js
"use server";

import { cookies } from "next/headers";
import { api } from "@/config/axios.config";
import { revalidateTag, unstable_cache } from "next/cache";

// Auth helper
async function getAuthHeaders() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Response helpers
function success(response) {
  return { success: true, status: response.data?.code, data: response.data?.data ?? response.data, message: response.data?.message };
}
function failure(error) {
  return { success: false, status: error?.response?.data?.code ?? 500, message: error?.response?.data?.message ?? error?.message };
}

// Cached reads (use unstable_cache)
export const getResource = async () => {
  // ...
  const fetcher = unstable_cache(async (t) => { ... }, ["cache-key", token], { tags: ["cache-tag"], revalidate: 60 });
  const data = await fetcher(token);
  return { success: true, data: data?.data ?? data };
};

// Mutations (invalidate cache)
export const updateResource = async (id, payload) => {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders.Authorization) return { success: false, message: "No active session." };
  const response = await api.patch(`/resource/${id}/`, payload, { headers: authHeaders });
  revalidateTag("cache-tag");
  return success(response);
};
```

### Cache Tags Reference

| Tag | Data |
|---|---|
| `user-profile` | User + tenant profile data |
| `team-members` | Team member list |
| `team-invites` | Pending invitations |
| `audit-logs` | Audit log entries |
| `tenant-domain` | Domain verification status |

---

## 20. Design Principles

1. **Token-first**: Always use CSS variables via Tailwind color utilities (`text-primary`, `bg-destructive/10`). Never use raw hex colors.
2. **Hierarchy via default-\* scale**: Use `default-900` for titles, `default-700` for labels, `default-500` for secondary text, `default-400` for placeholders/icons.
3. **Consistent status encoding**: `success` = verified/active/done, `warning` = pending/caution, `destructive` = error/delete/danger.
4. **Semantic sections**: All card headers/modals should have a tinted header area (`bg-primary/5` or `bg-destructive/5`) with an icon circle.
5. **Disabled states**: Always use `disabled:opacity-50 pointer-events-none` from button base; match in table rows during pending operations.
6. **Animations**: Use `transition-colors`, `transition-all`, `hover:scale-110`, `animate-spin` (spinner). Keep durations within 150–300ms.
7. **Spacing discipline**: `space-y-6` for form sections, `gap-3` or `gap-4` for flex button groups, `p-6` for card and modal bodies.
8. **Icon colors**: Match icon colors to their semantic role (`text-primary`, `text-destructive`, `text-default-400`). Always set explicit width/height classes.
