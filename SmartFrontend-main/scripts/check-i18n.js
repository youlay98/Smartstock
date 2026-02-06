#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Common English words that might be hardcoded
const commonWords = [
  'Login', 'Register', 'Logout', 'Home', 'Products', 'Orders', 'Customers',
  'Dashboard', 'Admin', 'Create', 'Edit', 'Delete', 'Save', 'Cancel',
  'Search', 'Filter', 'Add', 'Remove', 'View', 'Details', 'Settings',
  'Profile', 'Account', 'Password', 'Username', 'Email', 'Phone',
  'Address', 'City', 'State', 'Country', 'Price', 'Quantity', 'Total',
  'Subtotal', 'Tax', 'Checkout', 'Cart', 'Wishlist', 'Favorites',
  'Welcome', 'Hello', 'Goodbye', 'Thank you', 'Please', 'Error',
  'Success', 'Warning', 'Info', 'Loading', 'Processing', 'Complete',
  'Pending', 'Active', 'Inactive', 'Enabled', 'Disabled', 'Yes', 'No',
  'OK', 'Close', 'Open', 'Next', 'Previous', 'Back', 'Forward',
  'Submit', 'Reset', 'Clear', 'Update', 'Refresh', 'Download', 'Upload'
]

// Common German words that might be hardcoded
const germanWords = [
  'Anmelden', 'Registrieren', 'Abmelden', 'Startseite', 'Produkte', 'Bestellungen',
  'Kunden', 'Dashboard', 'Admin', 'Erstellen', 'Bearbeiten', 'Löschen', 'Speichern',
  'Abbrechen', 'Suchen', 'Filter', 'Hinzufügen', 'Entfernen', 'Anzeigen', 'Details',
  'Einstellungen', 'Profil', 'Konto', 'Passwort', 'Benutzername', 'E-Mail', 'Telefon',
  'Adresse', 'Stadt', 'Bundesland', 'Land', 'Preis', 'Menge', 'Gesamt',
  'Zwischensumme', 'Steuern', 'Kasse', 'Warenkorb', 'Wunschliste', 'Favoriten',
  'Willkommen', 'Hallo', 'Auf Wiedersehen', 'Danke', 'Bitte', 'Fehler',
  'Erfolg', 'Warnung', 'Information', 'Lädt', 'Verarbeitung', 'Abgeschlossen',
  'Ausstehend', 'Aktiv', 'Inaktiv', 'Aktiviert', 'Deaktiviert', 'Ja', 'Nein',
  'OK', 'Schließen', 'Öffnen', 'Weiter', 'Zurück', 'Zurück', 'Vorwärts',
  'Absenden', 'Zurücksetzen', 'Löschen', 'Aktualisieren', 'Aktualisieren', 'Herunterladen', 'Hochladen'
]

function scanDirectory(dir, extensions = ['.vue', '.js']) {
  const results = []
  
  function scanRecursive(currentDir) {
    const files = fs.readdirSync(currentDir)
    
    for (const file of files) {
      const filePath = path.join(currentDir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanRecursive(filePath)
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        
        lines.forEach((line, index) => {
          // Check for hardcoded strings in template
          if (line.includes('>') && line.includes('<')) {
            const words = line.split(/\s+/)
            words.forEach(word => {
              const cleanWord = word.replace(/[^\w]/g, '')
              if (commonWords.includes(cleanWord) || germanWords.includes(cleanWord)) {
                results.push({
                  file: filePath,
                  line: index + 1,
                  word: cleanWord,
                  context: line.trim()
                })
              }
            })
          }
          
          // Check for hardcoded strings in script
          if (line.includes('"') || line.includes("'")) {
            const matches = line.match(/"([^"]+)"/g) || line.match(/'([^']+)'/g) || []
            matches.forEach(match => {
              const word = match.replace(/['"]/g, '')
              if (commonWords.includes(word) || germanWords.includes(word)) {
                results.push({
                  file: filePath,
                  line: index + 1,
                  word: word,
                  context: line.trim()
                })
              }
            })
          }
        })
      }
    }
  }
  
  scanRecursive(dir)
  return results
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src')
console.log('Scanning for potential hardcoded strings...\n')

const results = scanDirectory(srcDir)

if (results.length === 0) {
  console.log('✅ No potential hardcoded strings found!')
} else {
  console.log(`⚠️  Found ${results.length} potential hardcoded strings:\n`)
  
  results.forEach(result => {
    console.log(`📁 ${result.file}:${result.line}`)
    console.log(`   Word: "${result.word}"`)
    console.log(`   Context: ${result.context}`)
    console.log('')
  })
  
  console.log('💡 Consider replacing these with translation keys using $t()')
}

console.log('\n�� Scan complete!') 