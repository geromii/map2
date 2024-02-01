import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CardExample() {
  return (
    <Card className="w-full opacity-50">
      <CardHeader>
        <CardTitle>Create Modifier</CardTitle>
        <CardDescription>Write a custom prompt describing a situation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Prompt</Label>
              <Input id="name" placeholder="Describe a situation" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Model</Label>
              <Select>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="next">GPT3.5</SelectItem>
                  <SelectItem value="sveltekit">GPT4</SelectItem>
                  <SelectItem value="astro">GPT4.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex md:block justify-center items-center h-full md:justify-start md:items-start md:h-auto">
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  )
}
