/* Textos de negocio — Gold Mining 2.0 */
const B = import.meta.env.BASE_URL;
export interface Plan {
  id: string; name: string; tag: string;
  machinePrice: number; capitalMin: number; capitalMax: number | null;
  capitalLabel: string; dailyPct: number;
  exampleCapital: number; exampleDaily: number; image: string;
}
export const plans: Plan[] = [
  { id: 'mini-perforadora', name: 'Mini Perforadora', tag: 'PLAN.01', machinePrice: 25, capitalMin: 50, capitalMax: 249, capitalLabel: '50 – 249 USDT', dailyPct: 2.5, exampleCapital: 50, exampleDaily: 1.25, image: `${B}images/machine-mini-perforadora.jpg` },
  { id: 'excavadora', name: 'Excavadora con Oruga', tag: 'PLAN.02', machinePrice: 75, capitalMin: 250, capitalMax: 749, capitalLabel: '250 – 749 USDT', dailyPct: 3.5, exampleCapital: 250, exampleDaily: 8.75, image: `${B}images/machine-excavadora.jpg` },
  { id: 'planta-minera', name: 'Planta Minera', tag: 'PLAN.03', machinePrice: 200, capitalMin: 750, capitalMax: 1999, capitalLabel: '750 – 1,999 USDT', dailyPct: 4.5, exampleCapital: 750, exampleDaily: 33.75, image: `${B}images/machine-planta-minera.jpg` },
  { id: 'planta-avanzada', name: 'Planta Minera Avanzada', tag: 'PLAN.04', machinePrice: 500, capitalMin: 2000, capitalMax: null, capitalLabel: '2,000 o más USDT', dailyPct: 5.5, exampleCapital: 2000, exampleDaily: 110, image: `${B}images/machine-planta-minera.jpg` },
];
export const hero = {
  badge: 'SISTEMA ACTIVO', titleLine1: 'GOLD', titleLine2: 'MINING',
  subtitle: 'El oro del futuro, hoy',
  description: 'Invierte en minería de oro y haz crecer tu capital',
  ctaPrimary: 'Registrarme ahora', ctaSecondary: 'Iniciar sesión', ctaTertiary: 'Conocer más',
};
export const howItWorks = {
  title: 'CÓMO FUNCIONA',
  steps: [
    { n: 1, title: 'Compra tu máquina', desc: 'Elige entre 4 planes' },
    { n: 2, title: 'Conecta tu wallet', desc: 'Tu capital se queda en tus manos' },
    { n: 3, title: 'Activa cada 24 horas', desc: 'Un toque y genera oro' },
    { n: 4, title: 'Genera todos los días', desc: 'Porcentaje diario sobre tu capital' },
    { n: 5, title: 'Mantenimiento cada 7 días', desc: 'Pausa breve y continúa' },
  ],
  example: { title: 'Ejemplo: Mini Perforadora', machine: '25 USD', capital: '100 USDT', daily: '2.50 USD / día' },
};
export const foundry = {
  title: 'FUNDIDORA',
  intro: 'Minas oro todos los días con tu máquina, pero ese oro necesita fundirse para convertirse en USD y llegar a tu billetera.',
  warning: 'Sin fundir, no puedes retirar.',
  flow: ['Minar', 'Fundir', 'USD', 'Retirar'],
  unlockTitle: 'Desbloqueo permanente',
  unlockSteps: [
    { text: 'Invita a', highlight: '2 directos', suffix: 'que activen su máquina' },
    { text: 'Cada directo invita a', highlight: '1 persona', suffix: '' },
    { text: 'Esos 2 de segundo nivel', highlight: 'activan su máquina', suffix: '' },
  ],
  energyCosts: [
    { material: 'Carbón', cost: 120 }, { material: 'Hierro', cost: 80 },
    { material: 'Oro', cost: 45 }, { material: 'Diamante', cost: 15 },
  ],
  energyNote: 'para fundir $50',
  energyBonus: [
    { amount: 50, desc: 'por cada directo desde el tercero' },
    { amount: 15, desc: 'por segundo nivel que active máquina' },
  ],
};
export const referrals = {
  title: 'REFERIDOS',
  intro: 'Ganas una comisión por cada máquina que compren las personas que invitas, en 2 niveles.',
  levels: [
    { n: 1, pct: 30, desc: 'del plan que compre tu directo' },
    { n: 2, pct: 10, desc: 'del plan que compre su invitado' },
  ],
  examples: [
    { text: 'Tu directo compra Planta Minera ($200) → ganas', amount: '$60' },
    { text: 'Su invitado compra Excavadora ($75) → ganas', amount: '$7.50' },
  ],
};
export const roulette = {
  title: 'RULETA',
  intro: 'Cada día tienes 3 tiradas gratuitas para ganar premios.',
  spinsLabel: 'Tiradas disponibles:', cta: 'Girar',
};
export const withdrawals = {
  title: 'RETIROS',
  intro: 'Luego de fundir tu oro, tus USD pasan a la billetera interna de la plataforma. Desde allí solicitas tu retiro y lo recibes en USDT (red TRC-20) en tu wallet conectada.',
  flow: ['Fundir', 'Billetera interna', 'Solicitar retiro', 'USDT en tu wallet'],
  details: [
    { label: 'Monto mínimo', value: '$20' }, { label: 'Comisión', value: '12%' },
    { label: 'Retiros por semana', value: 'Máx. 2' }, { label: 'Tiempo aproximado', value: '24 horas' },
    { label: 'Estado inicial', value: 'En procesamiento' },
  ],
  example: { text: 'Retiras $50 − $6 de comisión', result: 'Recibes $44 USDT' },
};
