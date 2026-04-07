#!/bin/bash
# Run after every Godot Web export to remove side.wasm reference
# Usage: bash patch_workjs.sh
FILE="web/public/godot/Work.js"
if [ -f "$FILE" ]; then
    sed -i "s|\[\`\${loadPath}.side.wasm\`\].concat(this.gdextensionLibs)|[].concat(this.gdextensionLibs)|g" "$FILE"
    echo "Patched $FILE — removed side.wasm"
else
    echo "Work.js not found"
fi
