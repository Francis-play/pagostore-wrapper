export type Region = {
  code: string
  label: string
  flag: string
}

export const REGIONS: Region[] = [
  { code: 'DO', label: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'AR', label: 'Argentina',       flag: '🇦🇷' },
  { code: 'CL', label: 'Chile',           flag: '🇨🇱' },
  { code: 'CO', label: 'Colombia',        flag: '🇨🇴' },
  { code: 'MX', label: 'México',          flag: '🇲🇽' },
  { code: 'PE', label: 'Perú',            flag: '🇵🇪' },
  { code: 'EC', label: 'Ecuador',         flag: '🇪🇨' },
  { code: 'BO', label: 'Bolivia',         flag: '🇧🇴' },
  { code: 'CR', label: 'Costa Rica',      flag: '🇨🇷' },
  { code: 'SV', label: 'El Salvador',     flag: '🇸🇻' },
  { code: 'GT', label: 'Guatemala',       flag: '🇬🇹' },
  { code: 'PA', label: 'Panamá',          flag: '🇵🇦' },
  { code: 'UY', label: 'Uruguay',         flag: '🇺🇾' },
  { code: 'PY', label: 'Paraguay',        flag: '🇵🇾' },
  { code: 'NI', label: 'Nicaragua',       flag: '🇳🇮' },
]
