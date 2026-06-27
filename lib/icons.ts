import { icons, LucideIcon, HelpCircle } from "lucide-react"

export type IconName = keyof typeof icons

export function getIcon(name: IconName | string): LucideIcon {
  if (name in icons) {
    return icons[name as IconName];
  } 
  
  return HelpCircle
}