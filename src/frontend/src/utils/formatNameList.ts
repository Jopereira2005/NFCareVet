const listFormatter = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' });

/** Joins names the Portuguese way: "Luna e Mingau", "Luna, Mingau e Bob". */
export function formatNameList(names: string[]): string {
  return listFormatter.format(names);
}
