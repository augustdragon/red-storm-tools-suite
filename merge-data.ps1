# PowerShell script to merge Red Storm and Baltic Approaches data files
param()

try {
    Write-Host "=== Merging NATO Aircraft Data ==="
    $rsNato = Get-Content "modules\red-storm\oob-generator\data\aircraft-nato.json" | ConvertFrom-Json
    $baNato = Get-Content "modules\baltic-approaches\oob-generator\data\aircraft-nato.json" | ConvertFrom-Json
    
    $merged = @{
        "_comment" = "Merged NATO Aircraft Database - Red Storm + Baltic Approaches"
        "_version" = "1.0.0"
        "_created" = (Get-Date -Format "yyyy-MM-dd")
        "_description" = "Combined aircraft specifications for all NATO forces across modules"
        "_modules" = @("RS", "BA")
    }
    
    # Add Red Storm aircraft
    foreach ($key in $rsNato.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $aircraft = $rsNato.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
            $aircraft | Add-Member -NotePropertyName "module" -NotePropertyValue "RS" -Force
            $merged[$key] = $aircraft
        }
    }
    
    # Add Baltic aircraft
    foreach ($key in $baNato.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $aircraft = $baNato.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
            $aircraft | Add-Member -NotePropertyName "module" -NotePropertyValue "BA" -Force
            $merged[$key] = $aircraft
        }
    }
    
    $merged | ConvertTo-Json -Depth 10 | Out-File "shared\data\aircraft-nato.json" -Encoding UTF8
    Write-Host "NATO aircraft merged successfully!"
    
    Write-Host "\n=== Merging WP Aircraft Data ==="
    $rsWP = Get-Content "modules\red-storm\oob-generator\data\aircraft-wp.json" | ConvertFrom-Json
    $baWP = Get-Content "modules\baltic-approaches\oob-generator\data\aircraft-wp.json" | ConvertFrom-Json
    
    $mergedWP = @{
        "_comment" = "Merged Warsaw Pact Aircraft Database - Red Storm + Baltic Approaches"
        "_version" = "1.0.0"
        "_created" = (Get-Date -Format "yyyy-MM-dd")
        "_description" = "Combined aircraft specifications for all Warsaw Pact forces across modules"
        "_modules" = @("RS", "BA")
    }
    
    # Add Red Storm WP aircraft
    foreach ($key in $rsWP.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $aircraft = $rsWP.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
            $aircraft | Add-Member -NotePropertyName "module" -NotePropertyValue "RS" -Force
            $mergedWP[$key] = $aircraft
        }
    }
    
    # Add Baltic WP aircraft
    foreach ($key in $baWP.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $aircraft = $baWP.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
            $aircraft | Add-Member -NotePropertyName "module" -NotePropertyValue "BA" -Force
            $mergedWP[$key] = $aircraft
        }
    }
    
    $mergedWP | ConvertTo-Json -Depth 10 | Out-File "shared\data\aircraft-wp.json" -Encoding UTF8
    Write-Host "WP aircraft merged successfully!"
    
    Write-Host "\n=== Merging Weapons Data ==="
    $rsWeapons = Get-Content "modules\red-storm\oob-generator\data\weapons.json" | ConvertFrom-Json
    $baWeapons = Get-Content "modules\baltic-approaches\oob-generator\data\weapons.json" | ConvertFrom-Json
    
    $mergedWeapons = @{
        "_comment" = "Merged Weapons Database - Red Storm + Baltic Approaches"
        "_version" = "1.0.0"
        "_created" = (Get-Date -Format "yyyy-MM-dd")
        "_description" = "Combined weapons specifications across all modules"
        "_modules" = @("RS", "BA")
    }
    
    # Merge guns
    $mergedWeapons["guns"] = @{}
    foreach ($key in $rsWeapons.guns.PSObject.Properties.Name) {
        $weapon = $rsWeapons.guns.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
        $weapon | Add-Member -NotePropertyName "module" -NotePropertyValue "RS" -Force
        $mergedWeapons["guns"][$key] = $weapon
    }
    foreach ($key in $baWeapons.guns.PSObject.Properties.Name) {
        $weapon = $baWeapons.guns.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
        $weapon | Add-Member -NotePropertyName "module" -NotePropertyValue "BA" -Force
        $mergedWeapons["guns"][$key] = $weapon
    }
    
    # Merge missiles
    $mergedWeapons["missiles"] = @{}
    foreach ($key in $rsWeapons.missiles.PSObject.Properties.Name) {
        $weapon = $rsWeapons.missiles.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
        $weapon | Add-Member -NotePropertyName "module" -NotePropertyValue "RS" -Force
        $mergedWeapons["missiles"][$key] = $weapon
    }
    foreach ($key in $baWeapons.missiles.PSObject.Properties.Name) {
        $weapon = $baWeapons.missiles.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
        $weapon | Add-Member -NotePropertyName "module" -NotePropertyValue "BA" -Force
        $mergedWeapons["missiles"][$key] = $weapon
    }
    
    $mergedWeapons | ConvertTo-Json -Depth 10 | Out-File "shared\data\weapons.json" -Encoding UTF8
    Write-Host "Weapons merged successfully!"
    
    Write-Host "\n=== Merging Name Mapping Data ==="
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
    
    # Merge NATO mappings
    foreach ($key in $rsMapping.NATO.PSObject.Properties.Name) {
        $mergedMapping["NATO"][$key] = @{
            "mappedName" = $rsMapping.NATO.$key
            "module" = "RS"
        }
    }
    foreach ($key in $baMapping.NATO.PSObject.Properties.Name) {
        $mergedMapping["NATO"][$key] = @{
            "mappedName" = $baMapping.NATO.$key
            "module" = "BA"
        }
    }
    
    # Merge WP mappings
    foreach ($nation in $rsMapping.WP.PSObject.Properties.Name) {
        $mergedMapping["WP"][$nation] = @{}
        foreach ($aircraft in $rsMapping.WP.$nation.PSObject.Properties.Name) {
            $mergedMapping["WP"][$nation][$aircraft] = @{
                "mappedName" = $rsMapping.WP.$nation.$aircraft
                "module" = "RS"
            }
        }
    }
    foreach ($nation in $baMapping.WP.PSObject.Properties.Name) {
        if (-not $mergedMapping["WP"][$nation]) {
            $mergedMapping["WP"][$nation] = @{}
        }
        foreach ($aircraft in $baMapping.WP.$nation.PSObject.Properties.Name) {
            $mergedMapping["WP"][$nation][$aircraft] = @{
                "mappedName" = $baMapping.WP.$nation.$aircraft
                "module" = "BA"
            }
        }
    }
    
    $mergedMapping | ConvertTo-Json -Depth 10 | Out-File "shared\data\aircraft-name-mapping.json" -Encoding UTF8
    Write-Host "Name mapping merged successfully!"
    
    Write-Host "\n=== Merging Note Rules Data ==="
    $rsNotes = Get-Content "modules\red-storm\oob-generator\data\aircraft-note-rules.json" | ConvertFrom-Json
    $baNotes = Get-Content "modules\baltic-approaches\oob-generator\data\aircraft-note-rules.json" | ConvertFrom-Json
    
    $mergedNotes = @{
        "_comment" = "Merged Aircraft Note Rules - Red Storm + Baltic Approaches"
        "_version" = "1.0.0"
        "_created" = (Get-Date -Format "yyyy-MM-dd")
        "_modules" = @("RS", "BA")
    }
    
    # Add Red Storm note rules
    foreach ($key in $rsNotes.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $rule = $rsNotes.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
            $rule | Add-Member -NotePropertyName "module" -NotePropertyValue "RS" -Force
            $mergedNotes[$key] = $rule
        }
    }
    
    # Add Baltic note rules
    foreach ($key in $baNotes.PSObject.Properties.Name) {
        if (-not $key.StartsWith("_")) {
            $rule = $baNotes.$key | ConvertTo-Json -Depth 10 | ConvertFrom-Json
            $rule | Add-Member -NotePropertyName "module" -NotePropertyValue "BA" -Force
            $mergedNotes[$key] = $rule
        }
    }
    
    $mergedNotes | ConvertTo-Json -Depth 10 | Out-File "shared\data\aircraft-note-rules.json" -Encoding UTF8
    Write-Host "Note rules merged successfully!"
    
    Write-Host "\n=== Data Merge Complete! ==="
    Write-Host "All merged data files created in shared/data/"
    
} catch {
    Write-Error "Failed to merge data: $_"
    exit 1
}