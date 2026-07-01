// Todas as datas do app são "dias" no fuso do usuário (São Paulo).
// toISOString() é UTC: às 22h BRT já virou o dia seguinte em UTC, o que
// gravava o log noturno na data errada. en-CA formata como YYYY-MM-DD.
const TZ = "America/Sao_Paulo";
const DAY_MS = 86_400_000;

export function todayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function ymdDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toLocaleDateString("en-CA", {
    timeZone: TZ,
  });
}

export function yesterdayDate(): string {
  return ymdDaysAgo(1);
}
