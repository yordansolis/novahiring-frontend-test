---
name: shadcn-ui-builder
description: Generate clean, modern UI using shadcn/ui components. Use when building React interfaces with consistent design and Tailwind.
---

When generating UI with shadcn/ui, always follow these rules:

1. **Use shadcn/ui components first**  
   - Prefer existing components (Button, Card, Input, Dialog, etc.)
   - Avoid creating custom components unless necessary

2. **Keep design clean and minimal**  
   - Use proper spacing (p-4, gap-4, etc.)
   - Avoid cluttered layouts

3. **Use Tailwind correctly**  
   - Follow consistent spacing and sizing
   - Avoid inline styles

4. **Structure components properly**  
   - Use Card, CardHeader, CardContent, CardFooter when needed
   - Keep hierarchy clear

5. **Make UI responsive**  
   - Use grid, flex, and responsive classes (md:, lg:)

6. **Use semantic layout**  
   - Group related elements
   - Keep forms structured and readable

7. **Avoid overengineering**  
   - Do not add unnecessary state or logic
   - Keep components simple

8. **Use consistent naming**  
   - Clear variable and component names

9. **Follow accessibility basics**  
   - Labels for inputs
   - Buttons with clear text

10. **Return complete and usable code**  
    - No incomplete snippets
    - Code should be ready to use

---

### Example

Create a simple login form using shadcn/ui:

- Use Card as container
- Include Input for email and password
- Add Button for submit
- Keep layout centered and clean

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold">Sign in</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Sign in</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
```
