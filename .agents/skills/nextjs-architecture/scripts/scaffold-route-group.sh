#!/usr/bin/env bash
# Scaffolds a Next.js App Router route group with a layout + page, following
# this skill's default project structure (see SKILL.md).
#
# Usage: ./scaffold-route-group.sh <group-name> [--app-dir src/app]
# Example: ./scaffold-route-group.sh marketing
#          -> creates src/app/(marketing)/layout.tsx + page.tsx

set -euo pipefail

GROUP_NAME="${1:?Usage: scaffold-route-group.sh <group-name> [--app-dir src/app]}"
APP_DIR="src/app"
if [[ "${2:-}" == "--app-dir" ]]; then
  APP_DIR="${3:?--app-dir requires a path}"
fi

TARGET="$APP_DIR/($GROUP_NAME)"
mkdir -p "$TARGET"

if [ -f "$TARGET/layout.tsx" ]; then
  echo "Refusing to overwrite existing $TARGET/layout.tsx"
  exit 1
fi

cat > "$TARGET/layout.tsx" << TSX
export default function ${GROUP_NAME^}Layout({ children }: { children: React.ReactNode }) {
  return <div className="${GROUP_NAME}-layout">{children}</div>;
}
TSX

cat > "$TARGET/page.tsx" << TSX
export default function ${GROUP_NAME^}Page() {
  return (
    <main>
      <h1>${GROUP_NAME^}</h1>
    </main>
  );
}
TSX

echo "Created route group: $TARGET"
echo "  - layout.tsx"
echo "  - page.tsx"
echo ""
echo "Next: add route-only components in a _components/ subfolder if needed (see SKILL.md)."
