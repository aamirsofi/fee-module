import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Demo component showcasing shadcn/ui components
 * This is a test component to evaluate shadcn/ui integration
 */
export function ShadcnDemo() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">shadcn/ui Component Demo</h1>
        <p className="text-muted-foreground">
          Testing shadcn/ui components on the testing branch
        </p>
      </div>

      {/* Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            Various button variants from shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      {/* Input Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>
            Form input components with different types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Text Input
            </label>
            <Input
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Email Input
            </label>
            <Input type="email" placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Password Input
            </label>
            <Input type="password" placeholder="Password" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Disabled Input
            </label>
            <Input disabled placeholder="Disabled input" />
          </div>
        </CardContent>
      </Card>

      {/* Card Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Card Component</CardTitle>
          <CardDescription>
            This is a card component with header, content, and footer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cards are great for grouping related content. You can use them for
            dashboards, forms, and content sections.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      {/* Integration Example */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Example</CardTitle>
          <CardDescription>
            Combining multiple shadcn/ui components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search
            </label>
            <div className="flex gap-2">
              <Input placeholder="Search..." className="flex-1" />
              <Button>Search</Button>
            </div>
          </div>
          {inputValue && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Current input value:</strong> {inputValue}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

