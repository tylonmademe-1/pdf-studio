export type ToolCategory =
  | "organize"
  | "convert"
  | "optimize"
  | "security"
  | "ocr"
  | "video";

export type ToolIconName =
  | "Files"
  | "Scissors"
  | "RotateCw"
  | "FileText"
  | "Images"
  | "FileDown"
  | "LockKeyhole"
  | "ScanText"
  | "Trash2"
  | "Copy"
  | "ArrowUpDown"
  | "LayoutGrid"
  | "FileSpreadsheet"
  | "Code"
  | "ShieldOff"
  | "Stamp"
  | "Hash"
  | "Layers"
  | "EyeOff"
  | "Wrench"
  | "GitCompare"
  | "Crop"
  | "FileCheck"
  | "FileSearch"
  | "FilePlus"
  | "ShieldAlert"
  | "Maximize"
  | "Split"
  | "RefreshCcw"
  | "FileUp"
  | "FolderArchive"
  | "Palette"
  | "PenTool"
  | "Maximize2"
  | "FileMinus"
  | "Table"
  | "Presentation"
  | "Image"
  | "FileCode"
  | "Code2"
  | "Globe"
  | "MessageSquareOff"
  | "Tags"
  | "FileEdit"
  | "SquareDashedBottomCode"
  | "Award"
  | "CheckCheck"
  | "ShieldX"
  | "TableProperties"
  | "FileBarChart"
  | "ShieldCheck"
  | "Video"
  | "Camera";

export type ToolStatus = "planned" | "in_development" | "ready";

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconName: ToolIconName;
  route: string;
  acceptedFileTypes: string[];
  supportsMultipleFiles: boolean;
  status: ToolStatus;
  badge?: string;
  features?: string[];
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  description: string;
  anchor: string;
}
