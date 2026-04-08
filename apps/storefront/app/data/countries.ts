export interface Country {
  code: string
  name: string
}

export const COUNTRIES: Country[] = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MC', name: 'Monaco' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'IE', name: 'Irlande' },
  { code: 'AT', name: 'Autriche' },
  { code: 'DK', name: 'Danemark' },
  { code: 'SE', name: 'Suède' },
  { code: 'NO', name: 'Norvège' },
  { code: 'FI', name: 'Finlande' },
  { code: 'PL', name: 'Pologne' },
  { code: 'CZ', name: 'République tchèque' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'États-Unis' },
]

export function countryName(code: string): string {
  return COUNTRIES.find((country) => country.code === code)?.name ?? code
}
