# Fix the aircraft name mapping merge
param()

try {
    Write-Host "=== Fixing Aircraft Name Mapping Structure ==="
    $rsMapping = Get-Content "modules\red-storm\oob-generator\data\aircraft-name-mapping.json" | ConvertFrom-Json
    $baMapping = Get-Content "modules\baltic-approaches\oob-generator\data\aircraft-name-mapping.json" | ConvertFrom-Json
    
    $mergedMapping = @{
        "_comment" = "Merged Aircraft Name Mapping - Red Storm + Baltic Approaches"
        "_version" = "1.0.0"
        "_created" = (Get-Date -Format "yyyy-MM-dd")
        "_modules" = @("RS", "BA")
        "NATO" = @{}
        "WP" = @{}
    }
    
    # Merge NATO mappings - simple string to string mapping
    foreach ($key in $rsMapping.NATO.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $mergedMapping["NATO"][$key] = $rsMapping.NATO.$key
        }
    }
    foreach ($key in $baMapping.NATO.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $mergedMapping["NATO"][$key] = $baMapping.NATO.$key
        }
    }
    
    # Merge WP mappings - nested by nation, then simple string to string
    foreach ($nation in $rsMapping.WP.PSObject.Properties.Name) {
        if (-not $nation.StartsWith("_")) {
            $mergedMapping["WP"][$nation] = @{}
            foreach ($aircraft in $rsMapping.WP.$nation.PSObject.Properties.Name) {
                $mergedMapping["WP"][$nation][$aircraft] = $rsMapping.WP.$nation.$aircraft
            }
        }
    }
    foreach ($nation in $baMapping.WP.PSObject.Properties.Name) {
        if (-not $nation.StartsWith("_")) {
            if (-not $mergedMapping["WP"][$nation]) {
                $mergedMapping["WP"][$nation] = @{}
            }
            foreach ($aircraft in $baMapping.WP.$nation.PSObject.Properties.Name) {
                $mergedMapping["WP"][$nation][$aircraft] = $baMapping.WP.$nation.$aircraft
            }
        }
    }
    
    $mergedMapping | ConvertTo-Json -Depth 10 | Out-File "shared\data\aircraft-name-mapping.json" -Encoding UTF8
    Write-Host "Fixed name mapping structure successfully!"
    
} catch {
    Write-Error "Failed to fix name mapping: $_"
    exit 1
}