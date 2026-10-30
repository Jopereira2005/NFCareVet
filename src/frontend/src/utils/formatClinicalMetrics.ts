const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

type Metrics = Record<string, unknown>;

const LINE_BUILDERS: ((metrics: Metrics) => string | null)[] = [
  ({ heartRate, respiratoryRate }) =>
    [heartRate !== undefined && `FC: ${heartRate} bpm`, respiratoryRate !== undefined && `FR: ${respiratoryRate} mpm`]
      .filter(Boolean)
      .join(' • ') || null,
  ({ temperature }) => (typeof temperature === 'number' ? `Temperatura: ${decimal.format(temperature)} °C` : null),
  ({ systolicBP, diastolicBP, capillaryRefillTime }) =>
    [
      systolicBP !== undefined && `PA: ${systolicBP}${diastolicBP !== undefined ? `/${diastolicBP}` : ''} mmHg`,
      capillaryRefillTime !== undefined && `TPC ${capillaryRefillTime}`,
    ]
      .filter(Boolean)
      .join(' • ') || null,
  ({ bloodGlucose }) => (bloodGlucose !== undefined ? `Glicemia: ${bloodGlucose} mg/dL` : null),
  ({ notes }) => (typeof notes === 'string' ? notes : null),
];

/** Turns a clinical event's `metrics` (vital signs, etc.) into readable lines. */
export function formatClinicalMetrics(metrics: Metrics | null | undefined): string {
  if (!metrics) return '';
  return LINE_BUILDERS.map((build) => build(metrics)).filter(Boolean).join('\n');
}
