/** Relógio injetável — permite testes determinísticos das regras que dependem de "agora". */
export interface Clock {
  now(): Date;
}
